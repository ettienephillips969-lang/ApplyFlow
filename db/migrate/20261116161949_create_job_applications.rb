
class CreateJobApplications < ActiveRecord::Migration[8.1]
  def change
    create_table :job_applications do |t|
      t.string :company_name, null: false
      t.string :job_title, null: false
      t.string :job_url
      t.string :status, null: false, default: "saved"
      t.text :notes
      t.date :applied_at

      t.timestamps
    end
  end
end
