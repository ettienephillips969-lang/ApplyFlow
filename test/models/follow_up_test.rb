require "test_helper"

class FollowUpTest < ActiveSupport::TestCase
  test "valid follow-up is valid" do
    follow_up = FollowUp.new(job_application: job_applications(:one), due_at: 1.day.from_now)

    assert follow_up.valid?
  end

  test "job application is required" do
    follow_up = FollowUp.new(due_at: 1.day.from_now)

    assert_not follow_up.valid?
    assert_includes follow_up.errors[:job_application], "must exist"
  end

  test "due date is required" do
    follow_up = FollowUp.new(job_application: job_applications(:one))

    assert_not follow_up.valid?
    assert_includes follow_up.errors[:due_at], "can't be blank"
  end

  test "completion and reopening preserve the due date and record both events" do
    follow_up = job_applications(:one).follow_ups.create!(due_at: 3.days.from_now)
    due_at = follow_up.due_at

    assert_difference("follow_up.job_application.application_activities.count", 1) do
      follow_up.update!(completed_at: Time.current)
    end
    assert_equal due_at, follow_up.reload.due_at
    assert_equal "follow_up_completed", follow_up.job_application.application_activities.order(:id).last.event_type

    assert_difference("follow_up.job_application.application_activities.count", 1) do
      follow_up.update!(completed_at: nil)
    end
    assert_equal due_at, follow_up.reload.due_at
    assert_equal "follow_up_reopened", follow_up.job_application.application_activities.order(:id).last.event_type
  end

  test "creation records an activity without copying the note" do
    follow_up = job_applications(:one).follow_ups.create!(due_at: 1.day.from_now, note: "Sensitive reminder text")
    activity = follow_up.job_application.application_activities.order(:id).last

    assert_equal "follow_up_created", activity.event_type
    assert_not_includes activity.description, "Sensitive reminder text"
  end
end
