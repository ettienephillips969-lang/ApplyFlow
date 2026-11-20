development_origins = ENV.fetch("FRONTEND_ORIGINS", "http://localhost:8000")
  .split(",")
  .map(&:strip)
  .reject(&:empty?)
production_origins = ENV.fetch("CORS_ALLOWED_ORIGINS", "")
  .split(",")
  .map(&:strip)
  .reject(&:empty?)
allowed_origins = Rails.env.development? ? development_origins : production_origins

if allowed_origins.any?
  Rails.application.config.middleware.insert_before 0, Rack::Cors do
    allow do
      origins(*allowed_origins)

      resource "/api/*",
        headers: :any,
        methods: %i[ get post put patch delete options head ]
    end
  end
end
