class RegController < ApplicationController
  require 'rubygems'
  require 'mongo'
  include Mongo
  require 'securerandom'
  
  @@userDbId = '63'
  @@contentDbId = '47'
  @@privateRange = 10000000000
  @@dbMeta = {}


  @@dbMeta['63'] = {:server => 'ds063698-a0.mongolab.com', :port => 63698, :db_name => 'heroku_app18544527', 
    :username => 'artCoder', :password => 'zwamygogo'}  

  
  @@dbMeta['31'] = {:server => 'ds031948.mongolab.com', :port => 31948, :db_name => 'zwamy', :username => 'leonzwamy', 
    :password => 'zw12artistic'}
  
  @@dbMeta['47'] = {:server => 'ds047539-a0.mongolab.com', :port => 47539, :db_name => 'heroku_app24219881',
  :username => 'artCoder', :password => 'zwamygogo' }
  
  @@dbMeta['53'] = {:server => 'ds053468-a0.mongolab.com', :port => 53468, :db_name => 'heroku_app16778260', 
    :username => 'artCoder', :password => 'zwamygogo'}
    
    
    
    userDbInfo = @@dbMeta[@@userDbId]
    @@userClient = MongoClient.new(userDbInfo[:server],userDbInfo[:port])
    @@userDb = @@userClient[userDbInfo[:db_name]]
    @@userDb.authenticate(userDbInfo[:username],userDbInfo[:password])
    
    contentDbInfo = @@dbMeta[@@contentDbId]
    @@contentClient = MongoClient.new(contentDbInfo[:server],contentDbInfo[:port])
    @@contentDb = @@contentClient[contentDbInfo[:db_name]]
    @@contentDb.authenticate(contentDbInfo[:username],contentDbInfo[:password])
  
  def utcMillis
    (Time.now.to_f*1000).to_i
  end
  
    
  def chromeReg
    if(params[:email]==nil)
      result = {"Status"=>"failure", "Message"=>"No email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
        
    if(params[:nickname]==nil)
      result = {"Status"=>"failure", "Message"=>"No nickname!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:deviceId]==nil)
      result = {"Status"=>"failure", "Message"=>"No deviceId!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    currTime = utcMillis()
    
    userSet = @@userDb["users"].find({"email"=>params[:email].strip.downcase})
    if userSet.count == 0
      result = {"Status"=>"failure", "Message"=>"No user found!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    user = userSet.to_a[0]
    
    
    # clear
    prevPlayerSet = @@userDb['clients'].find({"account"=>"chromecast"+params[:deviceId]})
    if prevPlayerSet.count > 0
      prevPlayer = prevPlayerSet.to_a[0]
      
      #be carefull about the following two lines. In the long run, they should be removed!!!
      #@userDb["users"].update({},{"$pull"=>{"playable_clients"=>prevPlayer["account"]}},{"multi"=>true})
      #@userDb["users"].update({},{"$pull"=>{"owned_clients"=>prevPlayer["account"]}},{"multi"=>true})
      
      @@userDb["users"].update({"id"=>prevPlayer["owner"]},{"$pull"=>{"playable_clients"=>prevPlayer["account"]}})
      @@userDb["users"].update({"id"=>prevPlayer["owner"]},{"$pull"=>{"owned_clients"=>prevPlayer["account"]}})
      @@userDb['users'].update({"id"=>{"$in"=>prevPlayer["playable_users"]}},{"$pull"=>{"playable_clients"=>prevPlayer["account"]}},{:multi=>true})
      
    end    

    @@userDb["clients"].remove({"account"=>("chromecast"+params[:deviceId])}) 
    
    @@userDb["users"].update({"email"=>params[:email].strip.downcase},{"$pull"=>{"playable_clients"=>("chromecast"+params[:deviceId])}})
    @@userDb["users"].update({"email"=>params[:email].strip.downcase},{"$addToSet"=>{"owned_clients"=>("chromecast"+params[:deviceId])}}) 
    @@userDb["users"].update({"email"=>params[:email].strip.downcase},{"$addToSet"=>{"selected_players"=>("chromecast"+params[:deviceId])}})
      
      
    player = {"account"=>"chromecast"+params[:deviceId],"owner"=>user["id"],"curr_play"=>-1, "curr_list"=>-1,
      "curr_image"=>-1,"nickname"=>params[:nickname],"last_visit"=>-1,"playable_users"=>[],"creation_time"=>currTime, 
      "autoInterval"=>10*60*1000, "lastAutoAssign"=>-1, "auto_user"=>user['email'], "curr_index"=>-1} 
      
    @@userDb["clients"].insert(player) 
    
    
    result = {"Status"=>"success", "RegToken"=>SecureRandom.hex, "Message"=>player["nickname"]+" has been created!"}  
    render :json=>result, :callback => params[:callback]
    return
  end

  
  
    
  def deviceReg
    if(params[:email]==nil)
      result = {"Status"=>"failure", "Message"=>"No email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:deviceMaker]==nil)
      result = {"Status"=>"failure", "Message"=>"No deviceMaker!"}
      render :json=>result, :callback => params[:callback]
      return
    end
        
    if(params[:nickname]==nil)
      result = {"Status"=>"failure", "Message"=>"No nickname!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:deviceId]==nil)
      result = {"Status"=>"failure", "Message"=>"No deviceId!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    currTime = utcMillis()
    
    userSet = @@userDb["users"].find({"email"=>params[:email].strip.downcase})
    if userSet.count == 0
      result = {"Status"=>"failure", "Message"=>"No user found!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    user = userSet.to_a[0]
    
    
    # clear
    prevPlayerSet = @@userDb['clients'].find({"account"=>params[:deviceMaker]+params[:deviceId]})
    if prevPlayerSet.count > 0
      prevPlayer = prevPlayerSet.to_a[0]
      @@userDb["users"].update({"id"=>prevPlayer["owner"]},{"$pull"=>{"owned_clients"=>prevPlayer["account"]}})
      @@userDb["users"].update({"id"=>prevPlayer["owner"]},{"$pull"=>{"playable_clients"=>prevPlayer["account"]}})
      @@userDb['users'].update({"id"=>{"$in"=>prevPlayer["playable_users"]}},{"$pull"=>{"playable_clients"=>prevPlayer["account"]}},{:multi=>true})
    end    

    @@userDb["clients"].remove({"account"=>(params[:deviceMaker]+params[:deviceId])}) 
    @@userDb["users"].update({"email"=>params[:email].strip.downcase},{"$pull"=>{"playable_clients"=>(params[:deviceMaker]+params[:deviceId])}})
    @@userDb["users"].update({"email"=>params[:email].strip.downcase},{"$addToSet"=>{"owned_clients"=>(params[:deviceMaker]+params[:deviceId])}})
    @@userDb["users"].update({"email"=>params[:email].strip.downcase},{"$addToSet"=>{"selected_players"=>(params[:deviceMaker]+params[:deviceId])}})
      
      
    player = {"account"=>params[:deviceMaker]+params[:deviceId],"owner"=>user["id"],"curr_play"=>-1, "curr_list"=>-1,
      "curr_image"=>-1,"nickname"=>params[:nickname],"last_visit"=>-1,"playable_users"=>[],"creation_time"=>currTime,
      "autoInterval"=>10*60*1000, "lastAutoAssign"=>-1, "auto_user"=>user['email'], "curr_index"=>-1} 
      
    @@userDb["clients"].insert(player) 
    
    
    result = {"Status"=>"success", "RegToken"=>SecureRandom.hex, "Message"=>player["nickname"]+" has been created!"}  
    render :json=>result, :callback => params[:callback]
    return
  end  
  
    
end  
