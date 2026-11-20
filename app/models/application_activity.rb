class ApplicationActivity < ApplicationRecord
  EVENT_TYPES = %w[
    application_created
    status_changed
    follow_up_created
    follow_up_completed
    follow_up_reopened
    interview_created
    interview_updated
    interview_cancelled
    interview_completed
  ].freeze

  belongs_to :job_application

  validates :event_type, presence: true, inclusion: { in: EVENT_TYPES }
  validates :description, presence: true
  validates :occurred_at, presence: true
end
