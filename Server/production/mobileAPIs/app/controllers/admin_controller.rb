class AdminController < ApplicationController
  require 'rubygems'
  require 'mongo'
  include Mongo
  
  #@@server = 'ds031948.mongolab.com'
  #@@port = 31948
  #@@db_name = 'zwamy'
  #@@username = 'leonzwamy'
  #@@password = 'zw12artistic'
  
  @@server = 'ds047478.mongolab.com'
  @@port = 47478
  @@db_name = 'heroku_app16778260'
  @@username = 'luckyleon'
  @@password = 'artkick123rocks'
 
  def home
  end
  
  def fixViewlists
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    viewlists = @db["viewlists"].find().to_a
    viewlists.each do |viewlist|
      firstImageID = viewlist["images"][0]
      imgObj = @db["images"].find({"id"=>firstImageID.to_i}).to_a[0]
      @db["viewlists"].update({"id"=>viewlist["id"]},{'$set'=>{'coverImage'=>imgObj["thumbnail"]}})
    end
    render json: {"result"=>"succeeded!"}
  end
  
  
  def images
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    @images = @db['images'].find().to_a
  end    
  
  def viewlists
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    @viewlists = @db['viewlists'].find().to_a
  end
  
  def viewlist
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    @viewlist = @db['viewlists'].find({"id"=>params[:id].to_i}).to_a[0]
    @images = []
    @viewlist["images"].each do|imageID|
       @images.append(@db['images'].find({'id'=>imageID.to_i}).to_a[0])
    end
  end
    
  def users
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    @users = @db['users'].find().to_a
  end
  
  def deleteUser
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    @userObj = @db['users'].find({"id"=>params[:id].to_i}).to_a[0]
  end
  
  
  def deleteCommit
    if params["yes"].to_i == 1
        @client = MongoClient.new(@@server,@@port)
        @db = @client[@@db_name]
        @db.authenticate(@@username,@@password)
        @db['users'].remove({"id"=>params[:id].to_i})
    end
    
    redirect_to :controller => "admin",:action => "users"   
  end
  
  def editUser
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    @userObj = @db['users'].find({"id"=>params[:id].to_i}).to_a[0]
  end
  
  def editCommit
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    #check blank
    error = false
    email_error = ''
    name_error = ''
    
    if params["email"]==''
      email_error="email cannot be blank!"
      error = true
      
    elsif params["old_email"]!=params["email"].downcase
      userSet = @db['users'].find({"email"=>params["email"].downcase})
      if userSet.count > 0
        email_error = "this email has been registered!"
        error = true
      end
    end
       
    if params["name"]==''
      name_error = "name cannot be blank!"
      error = true
    end
    
        
    if error
      @name_error=name_error
      @email_error = email_error
      @error = true 
      @email = params[:email]
      @old_email = params[:old_email]
      @name = params[:name]
      @userObj = @db['users'].find({"id"=>params[:id].to_i}).to_a[0]
      
      render :action => "editUser"
      return 
    end
    
    @db['users'].update({"id"=>params["id"].to_i},
    {"$set"=>{"email"=>params["email"].downcase,"name"=>params["name"]}})
    redirect_to :action => "users"
        
  end
  
  def createUser
  end
  
  def createCommit
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
        #check blank
    error = false
    email_error = ''
    name_error = ''
    
    if params["email"]==''
      email_error="email cannot be blank!"
      error = true
      
    else
      userSet = @db['users'].find({"email"=>params["email"].downcase})
      if userSet.count > 0
        email_error = "this email has been registered!"
        error = true
      end
    end
       
    if params["name"]==''
      name_error = "name cannot be blank!"
      error = true
    end
    
    if error
      @name_error=name_error
      @email_error = email_error
      @error = true 
      @email = params[:email]
      @name = params[:name]
      render :action => "createUser"
      return 
    end
    
    userObj = {"name"=>params["name"],"email"=>params["email"].downcase}
    currIndex = @db['index'].find().to_a[0]['user']
    userObj["id"] = currIndex+1
    
    emptyArrays = ["images","viewlists","friends","adds","requests","owned_clients",
                    "playable_clients","playable_clients","plays"]
    
    for emptyArray in emptyArrays
        userObj[emptyArray]=[]
    end    
    @db['users'].insert(userObj)
    @db['index'].update({},{"$set"=>{"user"=>currIndex+1}})
    redirect_to :action => "users"
    
  end
  
  def players
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    @players = @db['clients'].find({}).to_a  
  end
  
  def player
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    @player = @db['clients'].find({"id"=>params[:id].to_i}).to_a[0] 
    @owner = @db['users'].find({"id"=>@player["owner"]}).to_a[0] 
    @users = []
    @player["playable_users"].each do|userID|
      userObj = @db['users'].find({"id"=>userID.to_i}).to_a[0] 
      @users.append(userObj)
    end
  end
  
  def deletePlayer
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    @db["clients"].remove({"account"=>params[:account]})
    redirect_to :action => "players"
    
  end
  
  
  
end  
