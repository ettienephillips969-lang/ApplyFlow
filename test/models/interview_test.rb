require "test_helper"

class InterviewTest < ActiveSupport::TestCase
  test "valid interview is valid" do
    interview = Interview.new(job_application: job_applications(:one), starts_at: 1.day.from_now)

    assert interview.valid?
  end

  test "job application is required" do
    interview = Interview.new(starts_at: 1.day.from_now)

    assert_not interview.valid?
    assert_includes interview.errors[:job_application], "must exist"
  end

  test "status must be allowed" do
    interview = Interview.new(job_application: job_applications(:one), starts_at: 1.day.from_now, status: "pending")

    assert_not interview.valid?
    assert_includes interview.errors[:status], "is not included in the list"
  end

  test "start time is required" do
    interview = Interview.new(job_application: job_applications(:one))

    assert_not interview.valid?
    assert_includes interview.errors[:starts_at], "can't be blank"
  end

  test "end time must be later than start time" do
    starts_at = 1.day.from_now
    [ starts_at, starts_at - 1.minute ].each do |ends_at|
      interview = Interview.new(job_application: job_applications(:one), starts_at: starts_at, ends_at: ends_at)

      assert_not interview.valid?
      assert_includes interview.errors[:ends_at], "must be later than the start time"
    end
  end

  test "creation, update, completion and cancellation record activities" do
    interview = job_applications(:one).interviews.create!(starts_at: 1.day.from_now)
    activities = interview.job_application.application_activities
    assert_equal "interview_created", activities.order(:id).last.event_type

    interview.update!(location: "Online")
    assert_equal "interview_updated", activities.order(:id).last.event_type

    interview.update!(status: "completed")
    assert_equal "interview_completed", activities.order(:id).last.event_type

    interview.update!(status: "cancelled")
    assert_equal "interview_cancelled", activities.order(:id).last.event_type
  end

  test "activity descriptions do not include interview details" do
    interview = job_applications(:one).interviews.create!(starts_at: 1.day.from_now, location: "Private room")

    assert_not_includes interview.job_application.application_activities.order(:id).last.description, "Private room"
  end
end
