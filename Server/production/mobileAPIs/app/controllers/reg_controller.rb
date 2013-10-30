class RegController < ApplicationController
  require 'rubygems'
  require 'mongo'
  include Mongo
  require 'securerandom'
  
  #@@server = 'ds031948.mongolab.com'
  #@@port = 31948
  #@@db_name = 'zwamy'
  #@@username = 'leonzwamy'
  #@@password = 'zw12artistic'
  
  #@@server = 'ds047478.mongolab.com'
  #@@port = 47478
  #@@db_name = 'heroku_app16778260'
  #@@username = 'luckyleon'
  #@@password = 'artkick123rocks'
  
  @@server = 'ds051518-a0.mongolab.com'
  @@port = 51518
  @@db_name = 'heroku_app16777800'
  @@username = 'luckyleon'
  @@password = 'artkick123rocks'
  
  def utcMillis
    (Time.now.to_f*1000).to_i
  end
  
  def genCode(length,db)
    code = rand(36**length).to_s(36)
    while db['tclients'].find({"reg_code"=>code}).count>0
      code = rand(36**length).to_s(36)
    end  
    return code  
  end
  
  def getRegCode
    if(params[:deviceId]==nil)
      result = {"Status"=>"faiure", "Message"=>"No device id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    if @db['tclients'].find({"account"=>params[:deviceId]}).count>0
      code = genCode(5,@db)
      @db['tclients'].update({"account"=>params[:deviceId]},{"$set"=>{"reg_code"=>code,"gen_time"=>utcMillis()}})
      result = {"Status"=>"success", 
        "RegCode"=>code,
        "RetryInterval"=>30,
        "RetryDuration"=>900}
        @client.close
        render :json=>result, :callback => params[:callback]
        return
    end
    
    code = genCode(5,@db)
    tplayer = {"account"=>params[:deviceId], "reg_code"=>code, "gen_time"=>utcMillis()}
    @db['tclients'].insert(tplayer)
    result = {"Status"=>"success",
        "RegCode"=>code,
        "RetryInterval"=>30,
        "RetryDuration"=>900}
    @client.close
    render :json=>result, :callback => params[:callback]
  end
  
  def userReg
    if(params[:email]==nil)
      result = {"Status"=>"failure", "Message"=>"No email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:regCode]==nil)
      result = {"Status"=>"failure", "Message"=>"No regcode!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:nickname]==nil)
      result = {"Status"=>"failure", "Message"=>"No nickname!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    if @db["tclients"].find({"reg_code"=>params[:regCode]}).count == 0
      result = {"Status"=>"failure","Message"=>"No device matches!"}
      @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    tplayer = @db["tclients"].find({"reg_code"=>params[:regCode]}).to_a[0]
    
    
    
    currTime = utcMillis()
    
    if tplayer["gen_time"]+900*1000 < currTime
       result = {"Status"=>"failure","Message"=>"Your regcode is expired, please get another one!"}
       @client.close
       render :json=>result, :callback => params[:callback]
       return
    end
    
    if tplayer["try_time"] != nil
      if currTime-tplayer["try_time"] < 30*1000
        result = {"Status"=>"failure","Message"=>"You try too frequently! Please wait for 30 secondes!"}
        @db["tclients"].update({"reg_code"=>params[:regCode]},{"$set"=>{"try_time"=>currTime}})
        @client.close
        render :json=>result, :callback => params[:callback]
        return
      end  
    end
  
    if @db["users"].find({"email"=>params[:email].strip.downcase}).count == 0
      result = {"Status"=>"failure", "Message"=>"No user found!"}
      @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    user = @db["users"].find({"email"=>params[:email].strip.downcase}).to_a[0]
    player = {"account"=>tplayer["account"],"reg_code"=>tplayer["reg_code"],"owner"=>user["id"],"curr_play"=>-1,
      "curr_image"=>-1,"nickname"=>params[:nickname],"last_visit"=>-1,"playable_users"=>[],"creation_time"=>currTime,
      "reg_token"=>SecureRandom.hex}  
    
    # clearn up
    @db["clients"].remove({"account"=>tplayer["account"]}) 
    @db["users"].update({"email"=>params[:email].strip.downcase},{"$pull"=>{"owned_clients"=>tplayer["account"]}})
    @db["users"].update({"email"=>params[:email].strip.downcase},{"$push"=>{"owned_clients"=>tplayer["account"]}}) 
      
      
    @db["clients"].insert(player)
    @db["tclients"].remove({"account"=>tplayer["account"]})
    
   
    
    result = {"Status"=>"success", "Message"=>player["nickname"]+" has been created!"}  
    @client.close
    render :json=>result, :callback => params[:callback]
    return
  end
  
  def getRegStatus
    if(params[:deviceId]==nil)
      result = {"Status"=>"failure", "Message"=>"No device id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:deviceMaker]==nil)
      result = {"Status"=>"failure", "Message"=>"No device maker!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:regCode]==nil)
      result = {"Status"=>"failure", "Message"=>"No reg code!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    if @db['clients'].find({"account"=>params[:deviceMaker]+params[:deviceId], "reg_code"=>params[:regCode]}).count == 0
      result = {"Status"=>"failure", "RegToken"=>nil, "CustomerId"=>nil, "Creation Time"=>nil,
        "Message"=>"Device not registerd or wrong reg code!"}
      @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    player = @db['clients'].find({"account"=>params[:deviceMaker]+params[:deviceId], "reg_code"=>params[:regCode]}).to_a[0]
    result = {"Status"=>"success", "RegToken"=>player["reg_token"],"CustomerId"=>player["owner"],
      "Creation Time"=>player["creation_time"]}
    @client.close
    render :json=>result, :callback => params[:callback]
  end
  
  def deletePlayer
    if(params[:deviceId]==nil)
      result = {"Status"=>"failure", "Message"=>"No device id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:deviceMaker]==nil)
      result = {"Status"=>"failure", "Message"=>"No device maker!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    @db['clients'].remove({"account"=>params[:deviceMaker]+params[:deviceId]})
    result = {"Status"=>"success", "Message"=>"The device is removed!"}
    @client.close
    render :json=>result, :callback => params[:callback]
    
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
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    currTime = utcMillis()
    
    userSet = @db["users"].find({"email"=>params[:email].strip.downcase})
    if userSet.count == 0
      result = {"Status"=>"failure", "Message"=>"No user found!"}
      @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    user = userSet.to_a[0]
    
    # clear up
    @db["clients"].remove({"account"=>("chromecast"+params[:deviceId])}) 
    @db["users"].update({"email"=>params[:email].strip.downcase},{"$pull"=>{"owned_clients"=>("chromecast"+params[:deviceId])}})
    @db["users"].update({"email"=>params[:email].strip.downcase},{"$push"=>{"owned_clients"=>("chromecast"+params[:deviceId])}}) 
      
      
    player = {"account"=>"chromecast"+params[:deviceId],"owner"=>user["id"],"curr_play"=>-1,
      "curr_image"=>-1,"nickname"=>params[:nickname],"last_visit"=>-1,"playable_users"=>[],"creation_time"=>currTime} 
      
    @db["clients"].insert(player) 
    
    
    result = {"Status"=>"success", "Message"=>player["nickname"]+" has been created!"}  
    @client.close
    render :json=>result, :callback => params[:callback]
    return
  end

    
end  
