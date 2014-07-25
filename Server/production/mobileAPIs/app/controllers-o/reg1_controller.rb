class Reg1Controller < ApplicationController
  require 'rubygems'
  require 'mongo'
  include Mongo
  require 'securerandom'
  require 'net/http'
  
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
  
  #@@server = 'ds051518-a0.mongolab.com'
  #@@port = 51518
  #@@db_name = 'heroku_app16777800'
  #@@username = 'luckyleon'
  #@@password = 'artkick123rocks'
  
  #singleNode2
  @@server = 'ds053468-a0.mongolab.com'
  @@port = 53468
  @@db_name = 'heroku_app16778260'
  @@username = 'luckyleon'
  @@password = 'artkick123rocks'   
  
  
  
  def utcMillis
    (Time.now.to_f*1000).to_i
  end
  
  def filtCode(code,length)
    index = 0
    exs = ['1','i','0','o','l']
    while index < length
      if exs.include? code[index]
         code[index] = 'x'
      end
      index += 1
    end
    return code
  end
  
  def genCode(length,db)
    code = filtCode(rand(36**length).to_s(36),length)
    
    
    
    while db['tclients'].find({"reg_code"=>code}).count>0
      code = filtCode(rand(36**length).to_s(36),length)
    end  
    return code  
  end
  
  def getRegCode
    if(params[:deviceId]==nil)
      result = {"Status"=>"faiure", "Message"=>"No device id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:deviceMaker]==nil)
      result = {"Status"=>"faiure", "Message"=>"No maker!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    if @db['tclients'].find({"account"=>params[:deviceMaker]+params[:deviceId]}).count>0
      code = genCode(5,@db)
      @db['tclients'].update({"account"=>params[:deviceMaker]+params[:deviceId]},{"$set"=>{"reg_code"=>code,"gen_time"=>utcMillis()}})
      result = {"Status"=>"success", 
        "RegCode"=>code,
        "RetryInterval"=>30,
        "RetryDuration"=>900}
        @client.close
        render :json=>result, :callback => params[:callback]
        return
    end
    
    code = genCode(5,@db)
    tplayer = {"account"=>params[:deviceMaker]+params[:deviceId], "reg_code"=>code, "gen_time"=>utcMillis()}
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
    
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    userSet = @db['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
        @client.close
        render :json=>result, :callback => params[:callback]
        return
    end 
    
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
  

    
    user = userSet.to_a[0]
    player = {"account"=>tplayer["account"],"reg_code"=>tplayer["reg_code"],"owner"=>user["id"],"curr_play"=>-1,
      "curr_image"=>-1,"nickname"=>params[:nickname],"last_visit"=>-1,"playable_users"=>[],"creation_time"=>currTime,
      "reg_token"=>SecureRandom.hex}  
    
    # clean up
            
    prevPlayerSet = @db['clients'].find({"account"=>tplayer["account"]})
    if prevPlayerSet.count > 0
      prevPlayer = prevPlayerSet.to_a[0]
      #be carefull about the following two lines. In the long run, they should be removed!!!
      @db["users"].update({},{"$pull"=>{"playable_clients"=>prevPlayer["account"]}},{"multi"=>true})
      @db["users"].update({},{"$pull"=>{"owned_clients"=>prevPlayer["account"]}},{"multi"=>true})
      
      
      @db["users"].update({"id"=>prevPlayer["owner"]},{"$pull"=>{"owned_clients"=>prevPlayer["account"]}})
      prevPlayer["playable_users"].each do |userId|
        @db['users'].update({"id"=>userId},{"$pull"=>{"playable_clients"=>prevPlayer["account"]}})
        @db['users'].update({"id"=>userId.to_i},{"$pull"=>{"playable_clients"=>prevPlayer["account"]}})
      end
    end    
    # clean up done!
    
    
    
    @db["clients"].remove({"account"=>tplayer["account"]}) 
    
    
    @db["users"].update({"email"=>params[:email].strip.downcase},{"$push"=>{"owned_clients"=>tplayer["account"]}}) 
      
      
    @db["clients"].insert(player)
    @db["tclients"].remove({"account"=>tplayer["account"]})
    
   
    
    result = {"Status"=>"success", "Message"=>player["nickname"]+" has been created!"}  
    @client.close
    
    base = 'http://shrouded-chamber-7349.herokuapp.com/push'
    uri = URI(base)
    message = {}
    message['type'] = 'regPlayer'
    message['receiver'] = player['account']
    Net::HTTP.post_form(uri, message)    
    
    
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
    
end  