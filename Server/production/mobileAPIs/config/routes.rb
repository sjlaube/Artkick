Userpages::Application.routes.draw do
  # The priority is based upon order of creation:
  # first created -> highest priority.

  # Sample of regular route:
  #   match 'products/:id' => 'catalog#view'
  # Keep in mind you can assign values other than :controller and :action

  # Sample of named route:
  #   match 'products/:id/purchase' => 'catalog#purchase', :as => :purchase
  # This route can be invoked with purchase_url(:id => product.id)

  # Sample resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Sample resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Sample resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Sample resource route with more complex sub-resources
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', :on => :collection
  #     end
  #   end

  # Sample resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end


  # You can have the root of your site routed with "root"
  # just remember to delete public/index.html.
  # root :to => 'welcome#index'

  # See how all your routes lay out with "rake routes"

  # This is a legacy wild controller route that's not recommended for RESTful applications.
  # Note: This route will make all actions in every controller accessible via GET requests.
  match 'registration/v1.0/getRegCode'=> 'reg1#getRegCode'
  match 'registration/v1.0/getRegStatus'=> 'reg1#getRegStatus'
  
  
  match 'api/v1.1/client/getDefault' => 'client1#getDefault'
  match 'api/v1.1/client/getViewlist4' => 'client1#getViewlist4'
  match 'api/v1.1/client/getUserStatus'=> 'client1#getUserStatus'
  match 'api/v1.1/client/selectPlayers' => 'client1#selectPlayers'
  match 'api/v1.1/client/getSelectedPlayers' => 'client1#getSelectedPlayers'
  match 'api/v1.1/client/rateImage' => 'client1#rateImage'
  match 'api/v1.1/client/update2' => 'client1#update2'
  match 'api/v1.1/client/feedback' => 'client1#feedback'
  match 'api/v1.1/client/resetPassword' => 'client1#resetPassword'
  match 'api/v1.1/client/regUser' => 'client1#regUser'
  match 'api/v1.1/client/login' => 'client1#login'
  match 'api/v1.1/client/emailPassword' => 'client1#emailPassword'
  match 'api/v1.1/client/setAuto' => 'client1#setAuto'
  match 'api/v1.1/client/verifyUser' => 'client1#verifyUser'
  match 'api/v1.1/client/removeUser' => 'client1#removeUser'
  
  
  match 'api/v1.1/user/saveAsMyViewlist' => 'user1#saveAsMyViewlist'
  match 'api/v1.1/user/getMyViewlists' => 'user1#getMyViewlists'
  match 'api/v1.1/user/removeMyViewlist' => 'user1#removeMyViewlist'
  match 'api/v1.1/user/createMyViewlist' => 'user1#createMyViewlist'
  match 'api/v1.1/user/addImageToMyViewlist' => 'user1#addImageToMyViewlist'
  match 'api/v1.1/user/search' => 'user1#search'
  
  
  match 'api/v1.1/content/allCategories' =>  'content1#allCategories'
  match 'api/v1.1/content/allCategories2' =>  'content1#allCategories2'
  match 'api/v1.1/content/getViewlistsByCategory' => 'content1#getViewlistsByCategory'
  match 'api/v1.1/content/getViewlistsByCategory2' => 'content1#getViewlistsByCategory2'
  
  
  match 'api/v1.1/player/getUser' => 'player1#getUser'
  match 'api/v1.1/player/getPlayers' => 'player1#getPlayers'
  match 'api/v1.1/player/getOwnedPlayers' => 'player1#getOwnedPlayers'
  match 'api/v1.1/player/addUserToPlayer' => 'player1#addUserToPlayer'
  match 'api/v1.1/player/removePlayer' => 'player1#removePlayer'
  
  
  match 'api/v1.1/reg/userReg' => 'reg1#userReg'
  
  match ':controller(/:action(/:id))(.:format)'

end
