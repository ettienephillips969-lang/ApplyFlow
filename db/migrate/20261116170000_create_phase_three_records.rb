class CreatePhaseThreeRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :follow_ups do |t|
      t.references :job_application, null: false, foreign_key: { on_delete: :cascade }
      t.datetime :due_at, null: false
      t.text :note
      t.datetime :completed_at

      t.timestamps
    end
    add_index :follow_ups, [ :completed_at, :due_at ]

    create_table :interviews do |t|
      t.references :job_application, null: false, foreign_key: { on_delete: :cascade }
      t.datetime :starts_at, null: false
      t.datetime :ends_at
      t.string :location
      t.string :interview_type
      t.string :status, null: false, default: "scheduled"
      t.text :notes

      t.timestamps
    end
    add_index :interviews, :starts_at

    create_table :application_activities do |t|
      t.references :job_application, null: false, foreign_key: { on_delete: :cascade }
      t.string :event_type, null: false
      t.string :description, null: false
      t.datetime :occurred_at, null: false

      t.timestamps
    end
    add_index :application_activities, [ :job_application_id, :occurred_at ]
  end
end
