var fs = require('fs'); var PeerServer = require('peer').PeerServer; var server 
= PeerServer({
  port: 9000,
  ssl: {
    key: fs.readFileSync('/root/itp_io_cert/my-key.pem'),
    cert: fs.readFileSync('/root/itp_io_cert/my-cert.pem')
  }
});
