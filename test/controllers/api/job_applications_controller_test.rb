require "test_helper"

class Api::JobApplicationsControllerTest < ActionDispatch::IntegrationTest
  test "lists applications" do
    get api_job_applications_url

    assert_response :success
    assert_equal JobApplication.count, response.parsed_body.length
  end

  test "shows an application" do
    application = job_applications(:one)

    get api_job_application_url(application)

    assert_response :success
    assert_equal application.id, response.parsed_body["id"]
  end

  test "creates an application" do
    assert_difference("JobApplication.count", 1) do
      post api_job_applications_url, params: {
        job_application: { company_name: "Acme", job_title: "Engineer" }
      }, as: :json
    end

    assert_response :created
    assert_equal "saved", response.parsed_body["status"]
  end

  test "ignores attributes that are not permitted" do
    post api_job_applications_url, params: {
      job_application: { id: 999_999, company_name: "Acme", job_title: "Engineer" }
    }, as: :json

    assert_response :created
    assert_not_equal 999_999, response.parsed_body["id"]
  end

  test "updates an application" do
    application = job_applications(:one)

    patch api_job_application_url(application), params: {
      job_application: { status: "applied" }
    }, as: :json

    assert_response :success
    assert_equal "applied", response.parsed_body["status"]
  end

  test "deletes an application" do
    application = job_applications(:one)

    assert_difference("JobApplication.count", -1) do
      delete api_job_application_url(application)
    end

    assert_response :no_content
  end

  test "rejects invalid application creation" do
    assert_no_difference("JobApplication.count") do
      post api_job_applications_url, params: {
        job_application: { company_name: "Acme", job_title: "", status: "saved" }
      }, as: :json
    end

    assert_response :unprocessable_entity
    assert response.parsed_body["errors"].key?("job_title")
  end

  test "rejects invalid application updates without changing the record" do
    application = job_applications(:one)

    patch api_job_application_url(application), params: {
      job_application: { status: "pending" }
    }, as: :json

    assert_response :unprocessable_entity
    assert response.parsed_body["errors"].key?("status")
    assert_equal "saved", application.reload.status
  end

  test "returns not found when showing a missing application" do
    get api_job_application_url(id: -1)

    assert_response :not_found
    assert_equal "Job application not found", response.parsed_body["error"]
  end

  test "returns not found when updating a missing application" do
    patch api_job_application_url(id: -1), params: {
      job_application: { status: "applied" }
    }, as: :json

    assert_response :not_found
    assert_equal "Job application not found", response.parsed_body["error"]
  end

  test "returns not found when deleting a missing application" do
    delete api_job_application_url(id: -1)

    assert_response :not_found
    assert_equal "Job application not found", response.parsed_body["error"]
  end

end
