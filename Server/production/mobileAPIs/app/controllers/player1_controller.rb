class Player1Controller < ApplicationController
  require 'rubygems'
  require 'mongo'
  include Mongo
  require 'securerandom'
  
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
  
  def utcMillis
    (Time.now.to_f*1000).to_i
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
    

    players = @db["clients"].find({"owner"=>userSet.to_a[0]["id"]}).to_a
    result = {"Status"=>"success","players"=>players}
     @client.close
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
    
    user = userSet.to_a[0]
    players=[]
    
    playerHash = {}
    (user["playable_clients"]+user["owned_clients"]).each do |playerAccount|
      if playerHash[playerAccount] == nil
        playerHash[playerAccount] = 1
      end
    end
    
    playerHash.keys.each do |playerAccount|
      playerSet = @db["clients"].find({"account"=>playerAccount})
      if playerSet.count > 0
        players.push(playerSet.to_a[0])
      end
    end
    
    result = {"Status"=>"success", "players"=>players}
     @client.close
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
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    selfUserSet = @db['users'].find({"email"=>(params[:myEmail].strip).downcase,'tokens'=>params[:token].strip})
    if selfUserSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
         @client.close
        render :json=>result, :callback => params[:callback]
        return
    end     
    
    
    userSet = @db['users'].find({"email"=>params[:queryEmail].strip.downcase})
    if userSet.count==0
      result = {"Status"=>"failure", "Message"=>"No user found!"}
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    user = userSet.to_a[0]
    result = {"Status"=>"success", "Message"=>"Found "+user["name"]+"!"}
     @client.close
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
    
    playerSet = @db['clients'].find({"account"=>params[:playerId]})
    if playerSet.count==0
      result = {"Status"=>"failure", "Message"=>"No player found!"}
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    user = userSet.to_a[0]
    player = playerSet.to_a[0]
    
    if player["owner"]==user["id"]
      @db["clients"].remove({"account"=>player["account"]})
      @db["users"].update({"id"=>user["id"]},{"$pull"=>{"owned_clients"=>player["account"]}})
      @db["users"].update({},{"$pull"=>{"playable_clients"=>player["account"]}},{"multi"=>true})
      result = {"Status"=>"success", "Message"=>"Player "+player["nickname"]+" is deleted by its owner "+user["email"].strip.downcase+"!"}
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    @db["users"].update({"id"=>user["id"]},{"$pull"=>{"playable_clients"=>player["account"]}})
    
    player["playable_users"].each do |userId|
      @db['users'].update({"id"=>userId},{"$pull"=>{"playable_clients"=>player["account"]}})
    end
    
    result = {"Status"=>"success", "Message"=>"Player "+player["nickname"]+" is dismissed by user "+user["email"].strip.downcase+"!"}
     @client.close
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
    
    
    
    @client = MongoClient.new(@@server,@@port)
    @db = @client[@@db_name]
    @db.authenticate(@@username,@@password)
    
    
    selfUserSet = @db['users'].find({"email"=>(params[:myEmail].strip).downcase,'tokens'=>params[:token].strip})
    if selfUserSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}
         @client.close
        render :json=>result, :callback => params[:callback]
        return
    end     
    
    userSet = @db['users'].find({"email"=>params[:queryEmail].strip.downcase})
    if userSet.count==0
      result = {"Status"=>"failure", "Message"=>"No user found!"}
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    playerSet = @db['clients'].find({"account"=>params[:playerId]})
    if playerSet.count==0
      result = {"Status"=>"failure", "Message"=>"No player found!"}
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    user = userSet.to_a[0]
    player = playerSet.to_a[0]
    
    if player["owner"] == user["id"]
      result = {"Status"=>"failure", "Message"=>"You can't add yourself to your owned player!"}
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    if user["playable_clients"].include? player["account"]
      result = {"Status"=>"failure", "Message"=>user["email"].strip.downcase+" is already permitted to play on Player "+player["nickname"]+"!"}
       @client.close
      render :json=>result, :callback => params[:callback]
      return
    end
    
    @db["users"].update({"email"=>params[:queryEmail].strip.downcase},{"$push"=>{"playable_clients"=>player["account"]}}) 
    result = {"Status"=>"success", "Message"=>user["email"].strip.downcase+" is now permitted to play on Player "+player["nickname"]+"!"}
     @client.close
    render :json=>result, :callback => params[:callback]  
  end
  
end  
