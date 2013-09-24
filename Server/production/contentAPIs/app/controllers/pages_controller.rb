class PagesController < ApplicationController
  require 'rubygems'
  require 'mongo'
  include Mongo
  
  @@server = 'ds031948.mongolab.com'
  @@port = 31948
  @@db_name = 'zwamy'
  @@username = 'leonzwamy'
  @@password = 'zw12artistic'
  
  
  def index
  end
  
  
end  
