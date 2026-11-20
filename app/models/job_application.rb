
class JobApplication < ApplicationRecord
  STATUSES = %w[saved applied interview completed].freeze

  has_many :follow_ups, dependent: :destroy
  has_many :interviews, dependent: :destroy
  has_many :application_activities, dependent: :destroy

  validates :company_name, presence: true
  validates :job_title, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }

  after_create :record_creation_activity
  after_update :record_status_change_activity, if: :saved_change_to_status?

  private

  def record_creation_activity
    application_activities.create!(
      event_type: "application_created",
      description: "Application added",
      occurred_at: Time.current
    )
  end

  def record_status_change_activity
    previous_status, new_status = saved_change_to_status
    application_activities.create!(
      event_type: "status_changed",
      description: "Status changed from #{previous_status} to #{new_status}",
      occurred_at: Time.current
    )
  end
end
