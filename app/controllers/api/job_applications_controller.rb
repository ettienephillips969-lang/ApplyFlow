module Api
  class JobApplicationsController < ApplicationController
    before_action :set_job_application, only: %i[ show update destroy ]

    def index
      render json: JobApplication.all
    end

    def show
      render json: @job_application
    end

    def create
      job_application = JobApplication.new(job_application_params)

      if job_application.save
        render json: job_application, status: :created
      else
        render json: { errors: job_application.errors.to_hash }, status: :unprocessable_entity
      end
    end

    def update
      if @job_application.update(job_application_params)
        render json: @job_application
      else
        render json: { errors: @job_application.errors.to_hash }, status: :unprocessable_entity
      end
    end

    def destroy
      @job_application.destroy
      head :no_content
    end

    private

    def set_job_application
      @job_application = JobApplication.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      return render json: { error: "Job application not found" }, status: :not_found
    end

    def job_application_params
      params.require(:job_application).permit(:company_name, :job_title, :job_url, :status, :notes, :applied_at)
    end
  end
end
