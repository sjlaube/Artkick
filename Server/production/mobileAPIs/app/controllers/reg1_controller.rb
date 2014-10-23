class Reg1Controller < ApplicationController
  require 'rubygems'
  require 'mongo'
  include Mongo
  require 'securerandom'
  require 'net/http'
  
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
    return (Time.new.to_f*1000).to_i
  end
    
  def getListSet(listId)
     if @@contentDb == nil or @@userDb == nil
        connectDb()
     end
    
     if (not listId.is_a? Numeric) and (listId.include? 'top')
        return @@userDb['privLists'].find({'id'=>listId})
     end
     
     if listId.to_i >= @@privateRange
        return @@userDb['privLists'].find({'id'=>listId.to_i})
     end
     
     return @@contentDb['viewlists'].find({'id'=>listId.to_i})   
  end
  
  
  def getImageSet(imageId)
    
     if @@contentDb == nil or @@userDb == nil
        connectDb()
     end
     if imageId.to_i >= @@privateRange
        return @@userDb['privImages'].find({'id'=>imageId.to_i})
     end
     
     return @@contentDb['images'].find({'id'=>imageId.to_i})        
         
  end
  
  def getIndex(name)
      names = ['image','privImage','viewlist','privList','user']
      if not names.include? name
        return -1
      end
      
      baseUrl = 'http://pacific-oasis-9960.herokuapp.com/id/'
      url = baseUrl + name
      uri = URI(url)
      http = Net::HTTP.new(uri.host, uri.port)
      request = Net::HTTP::Get.new(uri.request_uri)
      res = http.request(request)
      dic = JSON.parse(res.body)
      if dic['Status'] != 'success'
        return -1
      end
      
      return dic['id'].to_i
  end   
  
  def connectDb
    userDbInfo = @@dbMeta[@@userDbId]
    @@userClient = MongoClient.new(userDbInfo[:server],userDbInfo[:port])
    @@userDb = @@userClient[userDbInfo[:db_name]]
    @@userDb.authenticate(userDbInfo[:username],userDbInfo[:password])
    
    contentDbInfo = @@dbMeta[@@contentDbId]
    @@contentClient = MongoClient.new(contentDbInfo[:server],contentDbInfo[:port])
    @@contentDb = @@contentClient[contentDbInfo[:db_name]]
    @@contentDb.authenticate(contentDbInfo[:username],contentDbInfo[:password])
    
  end
  
  
  def closeDb
    if @@userClient != nil
      @@userClient.close
    end
    
    if @@contentClient != nil
      @@contentClient.close
    end
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
    

    
    
    if @@userDb['tclients'].find({"account"=>params[:deviceMaker]+params[:deviceId]}).count>0
      code = genCode(5,@@userDb)
      @@userDb['tclients'].update({"account"=>params[:deviceMaker]+params[:deviceId]},{"$set"=>{"reg_code"=>code,"gen_time"=>utcMillis()}})
      result = {"Status"=>"success", 
        "RegCode"=>code,
        "RetryInterval"=>30,
        "RetryDuration"=>900}
        
        render :json=>result, :callback => params[:callback]
        return
    end
    
    code = genCode(5,@@userDb)
    tplayer = {"account"=>params[:deviceMaker]+params[:deviceId], "reg_code"=>code, "gen_time"=>utcMillis()}
    @@userDb['tclients'].insert(tplayer)
    result = {"Status"=>"success",
        "RegCode"=>code,
        "RetryInterval"=>30,
        "RetryDuration"=>900}

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
    
    
    

    
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end 
    
    if @@userDb["tclients"].find({"reg_code"=>params[:regCode]}).count == 0
      result = {"Status"=>"failure","Message"=>"No device matches!"}

      render :json=>result, :callback => params[:callback]
      return
    end
    
    tplayer = @@userDb["tclients"].find({"reg_code"=>params[:regCode]}).to_a[0]
    
    
    
    currTime = utcMillis()
    
    if tplayer["gen_time"]+900*1000 < currTime
       result = {"Status"=>"failure","Message"=>"Your regcode is expired, please get another one!"}

       render :json=>result, :callback => params[:callback]
       return
    end
    
    if tplayer["try_time"] != nil
      if currTime-tplayer["try_time"] < 30*1000
        result = {"Status"=>"failure","Message"=>"You try too frequently! Please wait for 30 secondes!"}
        @@userDb["tclients"].update({"reg_code"=>params[:regCode]},{"$set"=>{"try_time"=>currTime}})

        render :json=>result, :callback => params[:callback]
        return
      end  
    end
  

    
    user = userSet.to_a[0]
    player = {"account"=>tplayer["account"],"reg_code"=>tplayer["reg_code"],"owner"=>user["id"],"curr_play"=>-1,
      "curr_image"=>-1,"curr_list"=>-1, "nickname"=>params[:nickname],"last_visit"=>-1,"playable_users"=>[],"creation_time"=>currTime,
      "reg_token"=>SecureRandom.hex, "autoInterval"=>10*60*1000, "lastAutoAssign"=>-1, "auto_user"=>user['email'], "curr_index"=>-1}  
    
    # clean up
            
    prevPlayerSet = @@userDb['clients'].find({"account"=>tplayer["account"]})
    if prevPlayerSet.count > 0
      prevPlayer = prevPlayerSet.to_a[0]
      #be carefull about the following two lines. In the long run, they should be removed!!!
      @@userDb["users"].update({},{"$pull"=>{"playable_clients"=>prevPlayer["account"]}},{"multi"=>true})
      @@userDb["users"].update({},{"$pull"=>{"owned_clients"=>prevPlayer["account"]}},{"multi"=>true})
      
      
      @@userDb["users"].update({"id"=>prevPlayer["owner"]},{"$pull"=>{"owned_clients"=>prevPlayer["account"]}})
      prevPlayer["playable_users"].each do |userId|
        @@userDb['users'].update({"id"=>userId},{"$pull"=>{"playable_clients"=>prevPlayer["account"]}})
        @@userDb['users'].update({"id"=>userId.to_i},{"$pull"=>{"playable_clients"=>prevPlayer["account"]}})
      end
    end    
    # clean up done!
    
    
    
    @@userDb["clients"].remove({"account"=>tplayer["account"]}) 
    
    
    @@userDb["users"].update({"email"=>params[:email].strip.downcase},{"$push"=>{"owned_clients"=>tplayer["account"]}}) 
    @@userDb["users"].update({"email"=>params[:email].strip.downcase},{"$set"=>{"autoInterval"=>10*60*1000}})   
    @@userDb["clients"].insert(player)
    @@userDb["tclients"].remove({"account"=>tplayer["account"]})
    
   
    
    result = {"Status"=>"success", "Message"=>player["nickname"]+" has been created!"}  

    
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
    

    
    if @@userDb['clients'].find({"account"=>params[:deviceMaker]+params[:deviceId], "reg_code"=>params[:regCode]}).count == 0
      result = {"Status"=>"failure", "RegToken"=>nil, "CustomerId"=>nil, "Creation Time"=>nil,
        "Message"=>"Device not registerd or wrong reg code!"}

      render :json=>result, :callback => params[:callback]
      return
    end
    
    player = @@userDb['clients'].find({"account"=>params[:deviceMaker]+params[:deviceId], "reg_code"=>params[:regCode]}).to_a[0]
    result = {"Status"=>"success", "RegToken"=>player["reg_token"],"CustomerId"=>player["owner"],
      "Creation Time"=>player["creation_time"]}

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
    
    

    
    @@userDb['clients'].remove({"account"=>params[:deviceMaker]+params[:deviceId]})
    result = {"Status"=>"success", "Message"=>"The device is removed!"}

    render :json=>result, :callback => params[:callback]
    
  end
    
end  
