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
        if (msg.id <= acceptor_state.max_id) {
            acceptor_send_reject(ws);
        }
        else {
            acceptor_state.max_id = msg.id;
            acceptor_send_promise(ws);
        }
    }
    else if (msg.type === 'proposal') {
        if (msg.id < acceptor_state.max_id) {
            acceptor_send_reject(ws);
        }
        else {
            acceptor_state.max_id = msg.id;
            acceptor_state.value = msg.value;
            acceptor_send_accept(ws);
        }
    }
}
