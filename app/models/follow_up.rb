class FollowUp < ApplicationRecord
  belongs_to :job_application

  validates :due_at, presence: true

  after_create :record_creation_activity
  after_update :record_completion_activity, if: :saved_change_to_completed_at?

  private

  def record_creation_activity
    job_application.application_activities.create!(
      event_type: "follow_up_created",
      description: "Follow-up reminder created",
      occurred_at: Time.current
    )
  end

  def record_completion_activity
    event_type, description = if completed_at.present?
      [ "follow_up_completed", "Follow-up reminder completed" ]
    else
      [ "follow_up_reopened", "Follow-up reminder reopened" ]
    end

    job_application.application_activities.create!(
      event_type: event_type,
      description: description,
      occurred_at: Time.current
    )
  end
end
