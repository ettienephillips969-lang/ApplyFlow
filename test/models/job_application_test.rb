require "test_helper"

class JobApplicationTest < ActiveSupport::TestCase
  test "valid application is valid" do
    application = JobApplication.new(
      company_name: "Acme",
      job_title: "Software Engineer",
      status: "saved"
    )

    assert application.valid?
  end

  test "company name is required" do
    application = JobApplication.new(company_name: nil, job_title: "Software Engineer", status: "saved")

    assert_not application.valid?
    assert_includes application.errors[:company_name], "can't be blank"
  end

  test "job title is required" do
    application = JobApplication.new(company_name: "Acme", job_title: nil, status: "saved")

    assert_not application.valid?
    assert_includes application.errors[:job_title], "can't be blank"
  end

  test "status must be allowed" do
    application = JobApplication.new(company_name: "Acme", job_title: "Software Engineer", status: "pending")

    assert_not application.valid?
    assert_includes application.errors[:status], "is not included in the list"
  end

  test "creating an application records its creation activity" do
    application = JobApplication.create!(company_name: "Acme", job_title: "Engineer")

    activity = application.application_activities.sole
    assert_equal "application_created", activity.event_type
    assert_equal "Application added", activity.description
    assert_not_nil activity.occurred_at
  end

  test "changing status records the previous and new status" do
    application = JobApplication.create!(company_name: "Acme", job_title: "Engineer", status: "saved")

    assert_difference("application.application_activities.count", 1) do
      application.update!(status: "applied")
    end

    activity = application.application_activities.order(:id).last
    assert_equal "status_changed", activity.event_type
    assert_equal "Status changed from saved to applied", activity.description
  end

  test "updating an unrelated field does not record a status change" do
    application = JobApplication.create!(company_name: "Acme", job_title: "Engineer", status: "saved")

    assert_no_difference("application.application_activities.count") do
      application.update!(notes: "Recruiter role")
    end
  end

  test "deleting an application removes its associated records" do
    application = JobApplication.create!(company_name: "Acme", job_title: "Engineer")
    application.follow_ups.create!(due_at: 1.day.from_now)
    application.interviews.create!(starts_at: 2.days.from_now)
    activity_ids = application.application_activities.pluck(:id)

    application.destroy!

    assert_empty FollowUp.where(job_application_id: application.id)
    assert_empty Interview.where(job_application_id: application.id)
    assert_empty ApplicationActivity.where(id: activity_ids)
  end
end
