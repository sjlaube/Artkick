class RegController < ApplicationController
  require 'rubygems'
  require 'mongo'
  include Mongo
  require 'securerandom'
  
  @@userDbId = '63'
  @@contentDbId = '53'
  @@privateRange = 10000000000
  @@dbMeta = {}


  @@dbMeta['63'] = {:server => 'ds063698-a0.mongolab.com', :port => 63698, :db_name => 'heroku_app18544527', 
    :username => 'artCoder', :password => 'zwamygogo'}  

  
  @@dbMeta['31'] = {:server => 'ds031948.mongolab.com', :port => 31948, :db_name => 'zwamy', :username => 'leonzwamy', 
    :password => 'zw12artistic'}
  
  @@dbMeta['51'] = {:server => 'ds051518-a0.mongolab.com', :port => 51518, :db_name => 'heroku_app16777800',
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
      
      
      @@userDb["users"].update({"id"=>prevPlayer["owner"]},{"$pull"=>{"owned_clients"=>prevPlayer["account"]}})
      prevPlayer["playable_users"].each do |userId|
        @@userDb['users'].update({"id"=>userId},{"$pull"=>{"playable_clients"=>prevPlayer["account"]}})
        @@userDb['users'].update({"id"=>userId.to_i},{"$pull"=>{"playable_clients"=>prevPlayer["account"]}})
      end
    end    

    @@userDb["clients"].remove({"account"=>("chromecast"+params[:deviceId])}) 
    @@userDb["users"].update({"email"=>params[:email].strip.downcase},{"$pull"=>{"owned_clients"=>("chromecast"+params[:deviceId])}})
    @@userDb["users"].update({"email"=>params[:email].strip.downcase},{"$push"=>{"owned_clients"=>("chromecast"+params[:deviceId])}}) 
      
      
    player = {"account"=>"chromecast"+params[:deviceId],"owner"=>user["id"],"curr_play"=>-1,
      "curr_image"=>-1,"nickname"=>params[:nickname],"last_visit"=>-1,"playable_users"=>[],"creation_time"=>currTime} 
      
    @@userDb["clients"].insert(player) 
    
    
    result = {"Status"=>"success", "Message"=>player["nickname"]+" has been created!"}  
    render :json=>result, :callback => params[:callback]
    return
  end

    
end  
