#include <util/debug.hpp>
#include <web/server.hpp>
#include <web/default_startup.hpp>
#include <web/not_impl_startup.hpp>
#include <staticfile/staticfile_startup.hpp>
#include <string.h>
#include <string>
#include <iostream>

rwg_web::default_startup index_page("/static/index.html");
rwg_staticfile::startup staticfile("/static", "./fe");
rwg_web::not_impl_startup not_impl;
rwg_web::server server;

void http_handle(rwg_web::req &req,
                 rwg_web::res &res,
                 std::function<void ()>) {
    index_page.run(req, res);

    if (staticfile.run(req, res)) {
        return;
    }

    not_impl.run(req, res);
}

bool websocket_handshake(rwg_web::req &) {
    return true;
}

void websocket_frame_handle(rwg_websocket::endpoint &endpoint, std::function<void ()>) {
    std::basic_string<uint8_t> &payload = endpoint.frame().payload();
    std::string val(payload.begin(), payload.end());
    std::cout << val << std::endl;
    for (auto& other_endpoint : server.websocket().endpoints()) {
        if (endpoint.fd() != other_endpoint.first) {
            auto frame = other_endpoint.second->response();
            frame.opcode() = endpoint.frame().opcode();
            frame.payload() = payload;
            frame.write();
        }
    }
}

std::unique_ptr<rwg_websocket::endpoint>
websocket_endpoint_factory(rwg_web::req &) {
    return std::unique_ptr<rwg_websocket::endpoint>(new rwg_websocket::endpoint());
}

void init() {
    staticfile.read_config("./rwg_websocket/staticfile/mime.conf");

    server.http_handle(http_handle);
    server.websocket().endpoint_factory(websocket_endpoint_factory);
    server.websocket().handshake_handle(websocket_handshake);
    server.websocket().frame_handle(websocket_frame_handle);
}

int main() {
    init();
    server.listen("0.0.0.0", 5000);
    server.start();

    return 0;
}
