import proxy from 'express-http-proxy';
const proxyWithHeader = (serviceURL)=>{
    return proxy(serviceURL,{
        limit:'50mb',
        proxyReqOptDecorator: function(proxyReqOpts, srcReq) {
            delete proxyReqOpts.headers['x-internal-key'];
            if(srcReq.user) proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
            else proxyReqOpts.headers['x-user-id'] = '0';
            return proxyReqOpts;
        }
    })
}
export default proxyWithHeader;