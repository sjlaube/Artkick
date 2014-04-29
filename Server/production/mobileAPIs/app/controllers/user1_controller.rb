class User1Controller < ApplicationController
  require 'rubygems'
  require 'mongo'
  include Mongo
  require 'net/smtp'

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

  @@gmailAccount = 'leonzfarm'  
  @@gmailPassword = 'aljzcsjusqohrujk' 
  
  @@api_key = '7c028a32e596566b2632e6f672df55af-us7' 
  
  
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
  
  
  
  def addImageToMyViewlist
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
      
   if params[:listId]==nil or params[:listId].length==0
      result = {"Status"=>"failure", "Message"=>"error, no viewlist id!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
   
   if params[:imgId]==nil or params[:imgId].length==0
      result = {"Status"=>"failure", "Message"=>"error, no image id!"}
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
    
    userObj = userSet.to_a[0]
    
    if not userObj['private_lists'].include? params[:listId].to_i
      result = {"Status"=>"failure", "Message"=>"error, the viewlist doesn't belong to the user!"}

      render :json=>result, :callback => params[:callback]
      return
    end
    
    imageSet = getImageSet(params[:imgId])
    if imageSet.count == 0
      result = {"Status"=>"failure", "Message"=>"error, image doesn't exist!"}

      render :json=>result, :callback => params[:callback]
      return      

    end
  
    imageObj = imageSet.to_a[0]
    
    listSet = getListSet(params[:listId])
    if listSet.count == 0
      result = {"Status"=>"failure", "Message"=>"error, viewlist doesn't exist!"}

      render :json=>result, :callback => params[:callback]
      return  
      
    end
  
    listObj = listSet.to_a[0]
    
    if listObj['coverImage'] == nil
       @@userDb['privLists'].update({'id'=>listObj['id'].to_i},{'$set'=>{'coverImage'=>imageObj['thumbnail']}})
    end
    
    @@userDb['privLists'].update({'id'=>listObj['id'].to_i},{'$push'=>{'images'=>imageObj['id'].to_i}})
    
    result = {"Status"=>"success", "Message"=>"The image has been added to the viewlist!"}

    render :json=>result, :callback => params[:callback]
    
 end
 
 
 def removeImageFromMyViewlist
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
      
   if params[:listId]==nil or params[:listId].length==0
      result = {"Status"=>"failure", "Message"=>"error, no viewlist id!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
   
   if params[:imgId]==nil or params[:imgId].length==0
      result = {"Status"=>"failure", "Message"=>"error, no image id!"}
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
    
    userObj = userSet.to_a[0]
    
    if not userObj['private_lists'].include? params[:listId].to_i
      result = {"Status"=>"failure", "Message"=>"error, the viewlist doesn't belong to the user!"}

      render :json=>result, :callback => params[:callback]
      return
    end
        
    listSet = getListSet(params[:listId])
    if listSet.count == 0
      result = {"Status"=>"failure", "Message"=>"error, viewlist doesn't exist!"}

      render :json=>result, :callback => params[:callback]
      return  
      
    end
  
    listObj = listSet.to_a[0]   
    
    
    imageSet = getImageSet(params[:imgId])
    if imageSet.count > 0
       imageObj = imageSet.to_a[0]
       # in case we have removed the cover image
       if imageObj['thumbnail'] == listObj['coverImage']
         leftImages = []
         listObj['images'].each do |imageId|
           if imageId.to_i != params[:imgId].to_i
             leftImages.push imageId.to_i
           end
         end
         
         if leftImages.length > 0
           covImageSet = getImageSet(leftImages[0])
           if covImageSet.count > 0
             @@userDb['privLists'].update({'id'=>listObj['id'].to_i},{'$set'=>{'coverImage'=>covImageSet.to_a[0]['thumbnail']}})
           end
         end
       end

    end
    
    
    @@userDb['privLists'].update({'id'=>listObj['id'].to_i},{'$pull'=>{'images'=>params[:imgId].to_i}})
    result = {"Status"=>"success", "Message"=>"The image has been removed from the viewlist!"}

    render :json=>result, :callback => params[:callback]
    
 end    
    
  
 def removeMyViewlist
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
      
   if params[:listId]==nil or params[:listId].length==0
      result = {"Status"=>"failure", "Message"=>"error, no listId provided!"}
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
    
    userObj = userSet.to_a[0]
    if userObj['saved_lists'] == nil
      userObj['saved_lists'] = []
    end
    
    if userObj['private_lists'] == nil
      userObj['private_lists'] = []
    end
    
    
    if userObj['saved_lists'].include? params[:listId].to_i
      @@userDb['users'].update({'email'=>userObj['email']},{'$pull'=>{'saved_lists'=>params[:listId].to_i}})
      result = {"Status"=>"successs", "Message"=>"the user unsuscribed the viewlist!"}

      render :json=>result, :callback => params[:callback]
      return
    end
    
    
    if not userObj['private_lists'].include? params[:listId].to_i
      result = {"Status"=>"failure", "Message"=>"error, the viewlist doesn't belong to the user!"}

      render :json=>result, :callback => params[:callback]
      return
    end
    
    @@userDb['users'].update({'email'=>userObj['email']},{'$pull'=>{'private_lists'=>params[:listId].to_i}})
    @@userDb['privLists'].remove({'id'=>params[:listId].to_i})
    
    result = {"Status"=>"success", "Message"=>"The viewlist has been removed!"}

    render :json=>result, :callback => params[:callback]
 end
 
 
 def search
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
      
   if params[:keyword] == nil or params[:keyword].strip.length == 0
      result = {"Status"=>"failure", "Message"=>"error, no keyword provided!"}
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
    
    userObj = userSet.to_a[0]
    
    #search

    listObj = {'images'=>[]}
    keywords = []
    exes = ['museum','art','of', 'not', 'a', 'for', 'copyright','does','by','was',
            'and', 'from', 'at', 'am', 'over', 'away','the','des','di','galerie','collection','church']
             
    params[:keyword].strip.downcase.split.each do|keyword|
      if not exes.include? keyword
        keywords.push(keyword)
      end
    end
    
    keyMap = {}
    
    # personal images are not searchable 
    keywords.each do |keyword|
      imageSet = @@contentDb['images'].find({'topics'=>keyword},{:fields=>['id']}).limit(200)
      imageSet.to_a.each do |imageObj|
        if keyMap[imageObj['id'].to_i] == nil
           keyMap[imageObj['id'].to_i] = 1
        else
           keyMap[imageObj['id'].to_i] += 1
        end
      end
    end
    
    keyMap.keys.each do |imageId|
      if keyMap[imageId] == keywords.length
        listObj['images'].push(imageId)
      end
    end
    
    if listObj['images'].length > 0
      coverId = listObj['images'][0]
      imageSet = @@contentDb['images'].find({'id'=>coverId},{:fields=>['thumbnail']})
      if imageSet.count > 0
         listObj['coverImage'] = imageSet.to_a[0]['thumbnail']
      end
    end
    
    if userObj['search_list']!=nil
      @@userDb['users'].update({'email'=>userObj['email']},{'$pull'=>{'private_lists'=>userObj['search_list'].to_i}})
      @@userDb['privLists'].remove({'id'=>userObj['search_list'].to_i})
    end
          
    currIndex = getIndex('privList')
    if currIndex == -1
      result =  {"Status"=>"failure","Message"=>"ID server not available!"}

      render :json=>result, :callback => params[:callback] 
    end
        
    listObj['name'] = 'Last Search'
    listObj['id'] = currIndex
    listObj['datetime_created']=Time.now.utc.to_s
    listObj['private_user']=userObj['email']
    @@userDb['privLists'].insert(listObj)
    if userObj['private_lists'] == nil
       @@userDb['users'].update({'email'=>userObj['email']},{'$set'=>{'private_lists'=>[currIndex]}})
    else
       @@userDb['users'].update({'email'=>userObj['email']},{'$push'=>{'private_lists'=>currIndex}})
    end  
    @@userDb['users'].update({'email'=>userObj['email']},{'$set'=>{'search_list'=>currIndex}})
    userObj['search_list'] = currIndex
      
        
    result = {"Status"=>"success", "Message"=>"A viewlist has been created based on your search", "listId"=>userObj['search_list'].to_i, "images"=>listObj['images']}

    render :json=>result, :callback => params[:callback]     
    
 
 end
 
 
 def saveAsMyViewlist
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
      
  if params[:listId]==nil or params[:listId].length==0
      result = {"Status"=>"failure", "Message"=>"error, no viewlist id!"}
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
    
    userObj = userSet.to_a[0]
    
    
    fromListSet = getListSet(params[:listId])
    if fromListSet.count == 0
      result = {"Status"=>"failure", "Message"=>"error, list doesn't exist!"}

      render :json=>result, :callback => params[:callback]
      return
    end
    
    fromListObj = fromListSet.to_a[0]
    if fromListObj['private_user'] == nil
      result = {"Status"=>"failure", "Message"=>"error, this list is not a private list, you don't need to save it!"}

      render :json=>result, :callback => params[:callback]
      return      
    end
    

    fromUserSet = @@userDb['users'].find({'email'=>fromListObj['private_user']})
    if fromUserSet.count > 0
      fromUserObj = fromUserSet.to_a[0]
      if fromUserObj['email']==userObj['email']
        result = {"Status"=>"failure", "Message"=>"error, this is your own viewlist, you don't have to save it again!"}

        render :json=>result, :callback => params[:callback]
        return   
      end
      
    end
    
    

    if userObj['saved_lists'] == nil
      @@userDb['users'].update({'email'=>userObj['email']},{'$set'=>{'saved_lists'=>[fromListObj['id']]}})
    else
      @@userDb['users'].update({'email'=>userObj['email']},{'$push'=>{'saved_lists'=>fromListObj['id']}})
    end 
    
    result = {"Status"=>"success","Message"=>"Viewlist is saved", "listId"=>fromListObj['id']}

    render :json=>result, :callback => params[:callback] 
 end 
 
 
 
 def createMyViewlist
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
   
         
  if params[:listName]==nil or params[:listName].length==0
      result = {"Status"=>"failure", "Message"=>"error, no viewlist name!"}
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
    
    userObj = userSet.to_a[0]
    currIndex = getIndex('privList')
    if currIndex == -1
      result =  {"Status"=>"failure","Message"=>"ID server not available!"}

      render :json=>result, :callback => params[:callback] 
    end
        
    listObj = {'name'=>params[:listName], 'datetime_created'=>Time.now.utc.to_s,
      'id'=>currIndex,'images'=>[], 'private_user'=>userObj['email']}
      
    @@userDb['privLists'].insert(listObj)
    if userObj['private_lists'] == nil
      @@userDb['users'].update({'email'=>userObj['email']},{'$set'=>{'private_lists'=>[currIndex]}})
    else
      @@userDb['users'].update({'email'=>userObj['email']},{'$push'=>{'private_lists'=>currIndex}})
    end 
    
    result = {"Status"=>"success","Message"=>"Viewlist "+params[:listName]+" is created!", "listId"=>currIndex}

    render :json=>result, :callback => params[:callback] 
 end
 
  def renameMyViewlist
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
      
   if params[:listId]==nil or params[:listId].length==0
      result = {"Status"=>"failure", "Message"=>"error, no viewlist id!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
   
   if params[:newname]==nil or params[:newname].length==0
      result = {"Status"=>"failure", "Message"=>"error, no name provided!"}
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
    
    userObj = userSet.to_a[0]
    if not userObj['private_lists'].include? params[:listId].to_i
      result = {"Status"=>"failure", "Message"=>"error, this viewlist doesn't belong to the user!"}

      render :json=>result, :callback => params[:callback]
      return
    end
    
    @@userDb['privLists'].update({'id'=>params[:listId].to_i},{'$set'=>{'name'=>params[:newname]}})
    result = {"Status"=>"success", "Message"=>"The viewlist has been renamed!"}

    render :json=>result, :callback => params[:callback]
  end
 
  def getMyViewlists    
   if params[:email]==nil or params[:email].length==0
      result = {"Status"=>"failure", "Message"=>"error, no user email!"}
      render :json=>result, :callback => params[:callback]
      return
   end
   
   
    if(params[:token]==nil or params[:token].strip=='')
        result = {"Status"=>"failure", "Message"=>"token is missing!"}
        render :json=>result, :callback => params[:callback]
        return
    end
    
    
    editable = false
    
    if params[:editable]==1 
      editable = true
    end   

    
    
    userSet = @@userDb['users'].find({"email"=>(params[:email].strip).downcase,'tokens'=>params[:token].strip})
    if userSet.count == 0
        result = {"Status"=>"failure", "Message"=>"the user cannot be authenticated!"}

        render :json=>result, :callback => params[:callback]
        return
    end 
    
    userObj = userSet.to_a[0]
    if userObj['private_lists'] == nil
      userObj['private_lists'] = []
    end
    
    if userObj['saved_lists'] == nil
      userObj['saved_lists'] = []
    end
    
    if editable
      compLists = userObj['private_lists']
    else
      compLists = userObj['private_lists']+userObj['saved_lists']
    end
    
        
    viewlists = []
    compLists.each do |viewlistId|
      viewlistSet = @@userDb['privLists'].find({'id'=>viewlistId.to_i})
      if viewlistSet.count >0
        viewlists.push(viewlistSet.to_a[0])
      end
    end
    
    quickSort(viewlists,0,viewlists.length-1)
    result = {"Status"=>"success", "viewlists"=>viewlists}

    render :json=>result, :callback => params[:callback]  
       
 end  
  
def quickSort(objs,startIndex,endIndex)
  if startIndex >= endIndex
    return
  end
  
  piv = rand(startIndex..endIndex)
  
  temp = objs[endIndex]
  objs[endIndex]=objs[piv]
  objs[piv] = temp
  
  fb = startIndex
  
  for i in (startIndex..endIndex-1)
    comp1 = objs[i]["name"].downcase
    comp2 = objs[endIndex]["name"].downcase
    
    if comp1 == "last search"
      comp1 = " "
    end
    
    if comp2 == "last search"
      comp2 = " "
    end
    
    if comp1 < comp2
      temp = objs[fb]
      objs[fb]=objs[i]
      objs[i]=temp
      fb = fb+1
    end
  end
  
  temp = objs[fb]
  objs[fb] = objs[endIndex]
  objs[endIndex] = temp
  #print objs
  quickSort(objs,startIndex,fb)
  quickSort(objs,fb+1,endIndex)
end  
    
end  
