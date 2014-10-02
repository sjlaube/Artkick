class Player1Controller < ApplicationController
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
     
     if (not imageId.is_a? Numeric) and (imageId.include? 'getty')
        return @@userDb['gettyImages'].find({'id'=>imageId})
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
  
  def getOwnedPlayers
    if(params[:email]==nil)
      result = {"Status"=>"failure", "Message"=>"No email!"}
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
    

    players = @@userDb["clients"].find({"owner"=>userSet.to_a[0]["id"]},{:fields=>["account","nickname"]}).to_a
    result = {"Status"=>"success","players"=>players}

    render :json=>result, :callback => params[:callback]   
  end
  
  
  def getPlayers
    if(params[:email]==nil)
      result = {"Status"=>"failure", "Message"=>"No email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    

    
    
    #userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end 
    
    user = userSet.to_a[0]
    players=[]
    
    playerHash = {}
    (user["playable_clients"]+user["owned_clients"]).each do |playerAccount|
      if playerHash[playerAccount] == nil
        playerHash[playerAccount] = 1
      end
    end
    
    playerHash.keys.each do |playerAccount|
      playerSet = @@userDb["clients"].find({"account"=>playerAccount},{:fields=>["account","nickname","last_visit","curr_image","curr_list","autoInterval","orientation","online","stretch","orientation","uuid","hide_caption"]})
      if playerSet.count > 0
        players.push(playerSet.to_a[0])
      end
    end
    
    defaultObj = @@contentDb['defaults'].find().to_a[0]
    playerDetail = []
    players.each do |player|
      player.delete('_id')
      if player['orientation'] == nil
        player['orientation'] = 'horizontal'
      end
      
      if player['hide_caption'] == nil
        player['hide_caption'] = false
      end
      
      
      if player['stretch'] == nil
        player['stretch'] = false
      end
      
      if player['account'].include? 'chromecast'
        player['uuid'] = player['account'][10..-1]
      elsif player['account'].include? 'Roku'
        player['uuid'] = player['account'][4..-1]
      end
      
      
      
      
      
      if player['curr_image'] == -1
         player['curr_image'] = defaultObj["image"]       
      end
      
        imageSet = getImageSet(player['curr_image'])
        if imageSet.count > 0
          sImg = {}
          img = imageSet.to_a[0]
          sImg['Title'] = img['Title']
          sImg['thumbnail'] = img['thumbnail']
          sImg['url'] = img['url']
          
          if img['icon'] != nil
            sImg['icon'] = img['icon']
          else
            sImg['icon'] = img['thumbnail']
          end
          
          player['curr_image'] = sImg
        end
      
      
      
      if player['curr_list'] == nil
         player['curr_list'] = defaultObj["viewlist"]
      end
      
        listSet = getListSet(player['curr_list'])
        if listSet.count > 0
          listObj = listSet.to_a[0]
          player['curr_list'] = listObj['name']
        end      
      
      
      if player['autoInterval']== nil or player['autoInterval'] == 0
        player['autoPlay'] = "Never"
      elsif player['autoInterval'] == -1
        player['autoPlay'] = "Every morning"
      else
        player['autoPlay'] = (player['autoInterval'].to_i/1000/60).to_s+' min'
      end
      
      if user['selected_players'].include? player['account']
        player['selected'] = true
      end
      
      playerDetail.push(player)
    end
    
    
    result = {"Status"=>"success", "players"=>playerDetail}

    render :json=>result, :callback => params[:callback]
  end
  
  def getUser
    if(params[:myEmail]==nil)
      result = {"Status"=>"failure", "Message"=>"No my email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:queryEmail]==nil)
      result = {"Status"=>"failure", "Message"=>"No query email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    

    
    
    selfUserSet = @@userDb['users'].find({"email"=>(params[:myEmail].strip).downcase,'tokens'=>params[:token].strip})
    if selfUserSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end     
    
    
    userSet = @@userDb['users'].find({"email"=>params[:queryEmail].strip.downcase})
    if userSet.count==0
      result = {"Status"=>"failure", "Message"=>"No user found!"}

      render :json=>result, :callback => params[:callback]
      return
    end
    user = userSet.to_a[0]
    result = {"Status"=>"success", "Message"=>"Found "+user["name"]+"!"}

    render :json=>result, :callback => params[:callback]
  end
  
  
  def removePlayer
    if(params[:playerId]==nil)
      result = {"Status"=>"failure", "Message"=>"No player id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:email]==nil)
      result = {"Status"=>"failure", "Message"=>"No email!"}
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
    
    playerSet = @@userDb['clients'].find({"account"=>params[:playerId]})
    if playerSet.count==0
      result = {"Status"=>"failure", "Message"=>"No player found!"}

      render :json=>result, :callback => params[:callback]
      return
    end
    
    user = userSet.to_a[0]
    player = playerSet.to_a[0]
    
    if player["owner"]==user["id"]
      @@userDb["clients"].remove({"account"=>player["account"]})
      @@userDb["users"].update({"id"=>user["id"]},{"$pull"=>{"owned_clients"=>player["account"]}})
      @@userDb["users"].update({},{"$pull"=>{"playable_clients"=>player["account"]}},{"multi"=>true})
      
      player["playable_users"].each do |userId|
        @@userDb['users'].update({"id"=>userId},{"$pull"=>{"playable_clients"=>player["account"]}})
        @@userDb['users'].update({"id"=>userId.to_i},{"$pull"=>{"playable_clients"=>player["account"]}})
      end
      
      
      result = {"Status"=>"success", "Message"=>"Player "+player["nickname"]+" is deleted by its owner "+user["email"].strip.downcase+"!"}

       
      base = 'http://shrouded-chamber-7349.herokuapp.com/push'
      uri = URI(base)
      message = {}
      message['type'] = 'removePlayer'
      message['receiver'] = player['account']
      Net::HTTP.post_form(uri, message)
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    @@userDb["users"].update({"id"=>user["id"]},{"$pull"=>{"playable_clients"=>player["account"]}})
    @@userDb["users"].update({"id"=>user["id"].to_i},{"$pull"=>{"playable_clients"=>player["account"]}})
    @@userDb['clients'].update({"account"=>player["account"]},{"$pull"=>{"playable_users"=>user["id"].to_i}})

    
    result = {"Status"=>"success", "Message"=>"Player "+player["nickname"]+" is dismissed by user "+user["email"].strip.downcase+"!"}

    render :json=>result, :callback => params[:callback]
  end
  
  
  def addUserToPlayer
    if(params[:playerId]==nil)
      result = {"Status"=>"failure", "Message"=>"No player id!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:myEmail]==nil)
      result = {"Status"=>"failure", "Message"=>"No my email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    if(params[:queryEmail]==nil)
      result = {"Status"=>"failure", "Message"=>"No query email!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    

    
    
    selfUserSet = @@userDb['users'].find({"email"=>(params[:myEmail].strip).downcase,'tokens'=>params[:token].strip})
    if selfUserSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end     
    
    userSet = @@userDb['users'].find({"email"=>params[:queryEmail].strip.downcase})
    if userSet.count==0
      result = {"Status"=>"failure", "Message"=>"No user found!"}

      render :json=>result, :callback => params[:callback]
      return
    end
    
    playerSet = @@userDb['clients'].find({"account"=>params[:playerId]})
    if playerSet.count==0
      result = {"Status"=>"failure", "Message"=>"No player found!"}

      render :json=>result, :callback => params[:callback]
      return
    end
    
    user = userSet.to_a[0]
    player = playerSet.to_a[0]
    
    if player["owner"] == user["id"]
      result = {"Status"=>"failure", "Message"=>"You can't add yourself to your owned player!"}

      render :json=>result, :callback => params[:callback]
      return
    end
    
    if user["playable_clients"].include? player["account"]
      result = {"Status"=>"failure", "Message"=>user["email"].strip.downcase+" is already permitted to play on Player "+player["nickname"]+"!"}

      render :json=>result, :callback => params[:callback]
      return
    end
    
    @@userDb["users"].update({"email"=>params[:queryEmail].strip.downcase},{"$push"=>{"playable_clients"=>player["account"]}}) 
    @@userDb["clients"].update({'account'=>player["account"]},{'$push'=>{"playable_users"=>user['id'].to_i}})
    result = {"Status"=>"success", "Message"=>user["email"].strip.downcase+" is now permitted to play on Player "+player["nickname"]+"!"}

    render :json=>result, :callback => params[:callback]  
  end
  

  def setPlayerStatus
    if params[:players]==nil 
      result = {"Status"=>"failure", "Message"=>"No players!"}
      render :json=>result, :callback => params[:callback]
      return
    end
    
    status = false
    
    if params[:status]==1
      status = true
    end
    
    utctime = utcMillis()
    params[:players].each do |player|
      @@userDb['clients'].update({'account'=>player},{'$set'=>{'last_visit'=>utctime, 'online'=>status}})
    end
    
    result = {"Status"=>"success", "Message"=>"Player status updated!"}
    render :json=>result, :callback => params[:callback] 
    
  end  
  
  
  
end  
