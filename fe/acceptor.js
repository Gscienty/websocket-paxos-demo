var acceptor_state = {
    max_id: 0,
    value: ''
};

function acceptor_send_promise(ws) {
    var msg = {
        type: 'promise',
        max_id: acceptor_state.max_id,
        value: acceptor_state.value
    };
    ws.send(JSON.stringify(msg));
}

function acceptor_send_reject(ws) {
    var msg = {
        type: 'reject',
        max_id: acceptor_state.max_id
    };
    ws.send(JSON.stringify(msg));
}

function acceptor_send_accept(ws) {
    var msg = {
        type: 'accept'
    };
    ws.send(JSON.stringify(msg));
}

function acceptor_receive_message(ws, msg) {
    if (msg.type === 'prepare') {

        log('[prepare] msg id: ' + msg.id + '; state id:' + acceptor_state.max_id);

        if (msg.id <= acceptor_state.max_id) {
            acceptor_send_reject(ws);
            log('reject prepare');
        }
        else {
            acceptor_state.max_id = msg.id;
            acceptor_send_promise(ws);
            log('promise prepare');
        }
    }
    else if (msg.type === 'proposal') {

        log('[proposal] msg id: ' + msg.id + '; state id:' + acceptor_state.max_id);

        if (msg.id < acceptor_state.max_id) {
            acceptor_send_reject(ws);
            log('reject proposal');
        }
        else {
            log('accept proposal');
            acceptor_state.max_id = msg.id;
            acceptor_state.value = msg.value;
            acceptor_send_accept(ws);
        }
    }
}
