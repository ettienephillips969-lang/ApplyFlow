class Interview < ApplicationRecord
  STATUSES = %w[scheduled completed cancelled].freeze

  belongs_to :job_application

  validates :starts_at, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }
  validate :ends_at_must_be_after_starts_at

  after_create :record_creation_activity
  after_update :record_update_activity

  private

  def ends_at_must_be_after_starts_at
    return if ends_at.blank? || starts_at.blank? || ends_at > starts_at

    errors.add(:ends_at, "must be later than the start time")
  end

  def record_creation_activity
    job_application.application_activities.create!(
      event_type: "interview_created",
      description: "Interview scheduled",
      occurred_at: Time.current
    )
  end

  def record_update_activity
    event_type, description = if saved_change_to_status? && status == "cancelled"
      [ "interview_cancelled", "Interview cancelled" ]
    elsif saved_change_to_status? && status == "completed"
      [ "interview_completed", "Interview marked as completed" ]
    else
      [ "interview_updated", "Interview details updated" ]
    end

    job_application.application_activities.create!(
      event_type: event_type,
      description: description,
      occurred_at: Time.current
    )
  end
end
