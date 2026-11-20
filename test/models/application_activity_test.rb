require "test_helper"

class ApplicationActivityTest < ActiveSupport::TestCase
  test "valid activity is valid" do
    activity = ApplicationActivity.new(
      job_application: job_applications(:one),
      event_type: "application_created",
      description: "Application added",
      occurred_at: Time.current
    )

    assert activity.valid?
  end

  test "job application, event type, description and occurrence time are required" do
    activity = ApplicationActivity.new

    assert_not activity.valid?
    assert_includes activity.errors[:job_application], "must exist"
    assert_includes activity.errors[:event_type], "can't be blank"
    assert_includes activity.errors[:description], "can't be blank"
    assert_includes activity.errors[:occurred_at], "can't be blank"
  end

  test "event type must be supported" do
    activity = ApplicationActivity.new(
      job_application: job_applications(:one),
      event_type: "unknown",
      description: "An event",
      occurred_at: Time.current
    )

    assert_not activity.valid?
    assert_includes activity.errors[:event_type], "is not included in the list"
  end
end
