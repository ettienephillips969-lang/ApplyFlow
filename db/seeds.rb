# Fictional sample applications for local development and manual testing.
# Existing records with the same company and job title are left unchanged.
sample_applications = [
  {
    company_name: "Takealot",
    job_title: "Junior Rails Developer",
    status: "applied",
    applied_at: Date.new(2026, 10, 29),
    notes: "Submitted a tailored application highlighting Rails and PostgreSQL project work. Waiting for an initial response.",
  },
  {
    company_name: "Discovery",
    job_title: "Software Engineer",
    status: "interview",
    applied_at: Date.new(2026, 10, 17),
    notes: "First-round technical interview scheduled. Review problem-solving examples and recent project decisions.",
  },
  {
    company_name: "Capitec",
    job_title: "Junior Web Developer",
    status: "saved",
    applied_at: nil,
    notes: "Saved to compare the role requirements and prepare a focused application.",
  },
  {
    company_name: "Yoco",
    job_title: "Backend Developer",
    status: "applied",
    applied_at: Date.new(2026, 11, 1),
    notes: "Application submitted with emphasis on API development, testing, and database design.",
  },
  {
    company_name: "OfferZen",
    job_title: "Ruby on Rails Developer",
    status: "interview",
    applied_at: Date.new(2026, 10, 9),
    notes: "Technical discussion arranged. Prepare to walk through a small Rails feature from model to API.",
  },
  {
    company_name: "Woolworths",
    job_title: "Graduate Developer",
    status: "saved",
    applied_at: nil,
    notes: "Saved for the next graduate intake. Check the role criteria before submitting an application.",
  },
  {
    company_name: "Amazon",
    job_title: "Junior Software Developer",
    status: "completed",
    applied_at: Date.new(2026, 6, 12),
    notes: "Application process marked complete after the final status update.",
  },
  {
    company_name: "Derivco",
    job_title: "Full Stack Developer",
    status: "applied",
    applied_at: Date.new(2026, 10, 23),
    notes: "Submitted project examples covering backend endpoints and responsive user interfaces.",
  },
  {
    company_name: "Mr Price Group",
    job_title: "Web Developer",
    status: "saved",
    applied_at: nil,
    notes: "Saved for review. Compare the frontend requirements with current portfolio projects.",
  },
  {
    company_name: "Entelect",
    job_title: "Graduate Software Engineer",
    status: "interview",
    applied_at: Date.new(2026, 10, 2),
    notes: "Interview stage. Prepare examples of collaboration, debugging, and learning a new codebase.",
  },
  {
    company_name: "Luno",
    job_title: "Backend Engineer",
    status: "completed",
    applied_at: Date.new(2026, 5, 20),
    notes: "Application process closed and moved to completed for tracking purposes.",
  },
  {
    company_name: "PayFast",
    job_title: "Junior Ruby Developer",
    status: "applied",
    applied_at: Date.new(2026, 11, 5),
    notes: "Application sent with a short summary of Ruby experience and API-focused project work.",
  },
]

created_count = 0
skipped_count = 0

sample_applications.each do |attributes|
  was_created = false

  JobApplication.find_or_create_by!(
    company_name: attributes.fetch(:company_name),
    job_title: attributes.fetch(:job_title)
  ) do |application|
    was_created = true
    application.assign_attributes(attributes.except(:company_name, :job_title))
  end

  if was_created
    created_count += 1
    puts "Created: #{attributes[:company_name]} — #{attributes[:job_title]}"
  else
    skipped_count += 1
    puts "Skipped existing: #{attributes[:company_name]} — #{attributes[:job_title]}"
  end
end

puts "Seed complete: #{created_count} created, #{skipped_count} existing records skipped."
