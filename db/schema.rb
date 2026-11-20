# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_11_16_170000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "application_activities", force: :cascade do |t|
    t.bigint "job_application_id", null: false
    t.string "event_type", null: false
    t.string "description", null: false
    t.datetime "occurred_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["job_application_id", "occurred_at"], name: "idx_on_job_application_id_occurred_at_f6e4643b42"
    t.index ["job_application_id"], name: "index_application_activities_on_job_application_id"
  end

  create_table "follow_ups", force: :cascade do |t|
    t.bigint "job_application_id", null: false
    t.datetime "due_at", null: false
    t.text "note"
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["completed_at", "due_at"], name: "index_follow_ups_on_completed_at_and_due_at"
    t.index ["job_application_id"], name: "index_follow_ups_on_job_application_id"
  end

  create_table "interviews", force: :cascade do |t|
    t.bigint "job_application_id", null: false
    t.datetime "starts_at", null: false
    t.datetime "ends_at"
    t.string "location"
    t.string "interview_type"
    t.string "status", default: "scheduled", null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["job_application_id"], name: "index_interviews_on_job_application_id"
    t.index ["starts_at"], name: "index_interviews_on_starts_at"
  end

  create_table "job_applications", force: :cascade do |t|
    t.string "company_name", null: false
    t.string "job_title", null: false
    t.string "job_url"
    t.string "status", default: "saved", null: false
    t.text "notes"
    t.date "applied_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "application_activities", "job_applications", on_delete: :cascade
  add_foreign_key "follow_ups", "job_applications", on_delete: :cascade
  add_foreign_key "interviews", "job_applications", on_delete: :cascade
end
