require 'sinatra'

set :bind, '0.0.0.0'
set :port, 3000
set :environment, :production

get "/" do
    send_file "#{__dir__}/../frontend/index.html"
end

get "/index.js" do
    send_file "#{__dir__}/../frontend/app.js"
end