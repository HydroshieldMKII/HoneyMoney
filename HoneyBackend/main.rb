require 'sinatra'

set :bind, '0.0.0.0'
set :port, 3000
set :environment, :production

get "/" do
    send_file "/root/veille-technologique-420-1SH-SW/HoneyFrontEnd/dist/HoneyFrontEnd/browser/index.html"
end

get "/*.js" do
    content_type 'application/javascript'
    send_file "/root/veille-technologique-420-1SH-SW/HoneyFrontEnd/dist/HoneyFrontEnd/browser/#{params['splat'][0]}.js"
end

get "/styles-*.css" do
    content_type 'text/css'
    send_file "/root/veille-technologique-420-1SH-SW/HoneyFrontEnd/dist/HoneyFrontEnd/browser/styles-#{params['splat'][0]}.css"
end