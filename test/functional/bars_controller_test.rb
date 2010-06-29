require 'test_helper'

class BarsControllerTest < ActionController::TestCase
  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:bars)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create bar" do
    assert_difference('Bar.count') do
      post :create, :bar => { }
    end

    assert_redirected_to bar_path(assigns(:bar))
  end

  test "should show bar" do
    get :show, :id => bars(:one).to_param
    assert_response :success
  end

  test "should get edit" do
    get :edit, :id => bars(:one).to_param
    assert_response :success
  end

  test "should update bar" do
    put :update, :id => bars(:one).to_param, :bar => { }
    assert_redirected_to bar_path(assigns(:bar))
  end

  test "should destroy bar" do
    assert_difference('Bar.count', -1) do
      delete :destroy, :id => bars(:one).to_param
    end

    assert_redirected_to bars_path
  end
end
