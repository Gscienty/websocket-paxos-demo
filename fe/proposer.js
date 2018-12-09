var proposer_state = [ 'prepare', 'election', 'success' ];
var proposer_state = {
    value: '',
    prepare_id: 0,
    promise_max_id: 0,
    state: 'prepare',
    acceptor_count: 0,
    promise_count: 0,
    accept_count: 0,
    prepare_timeout_handler: 0,
};

function proposer_restart_prepare(prepare) {
    proposer_state.prepare_id = prepare;
    proposer_state.promise_max_id = 0;
    proposer_state.state = 'prepare';
    proposer_state.promise_count = 0;
    proposer_state.accept_count = 0;
    clearTimeout(proposer_state.prepare_timeout_handler);
}

function proposer_send_prepare(ws) {
    var msg = {
        type: 'prepare',
        id: proposer_state.prepare_id;
    };
    ws.send(JSON.stringify(msg));
    
    proposer_state.prepare_timeout_handler = setTimeout(function () {
        proposer_restart_prepare(proposer_state.prepare_id + 1);
    }, 1000);
}

function proposer_send_proposal(ws) {
    var msg = {
        type: 'proposal',
        id: proposer_state.prepare_id,
        value: proposer_state.value
    };
    ws.send(JSON.stringify(msg));

    proposer_state.prepare_timeout_handler = setTimeout(function () {
        proposer_restart_prepare(proposer_state.prepare_id + 1);
    }, 1000);
}

function proposer_send_learner(ws) {

}

function proposer_receive_message(ws, msg) {
    if (msg.type === 'acceptor_hello') {
        proposer_state.acceptor_count++;
    }
    else if (msg.type === 'promise' && proposer_state.state === 'prepare') {
        // promise msg = {
        //  type: 'promise',
        //  max_id: <number>,
        //  value: <string>
        // }

        proposer_state.promise_count++;

        if (proposer_state.promise_max_id <= msg.max_id) {
            proposer_state.value = msg.value;
        }

        if (Math.floor(proposer_state.acceptor_count / 2) < proposer_state.promise_count) {
            proposer_state.state = 'election';
            clearTimeout(proposer_state.prepare_timeout_handler);
            proposer_send_proposal(ws);
        }
    }
    else if (msg.type === 'reject') {
        proposer_restart_prepare(msg.max_id + 1);
    }
    // accept msg = {
    //  type: 'accept'
    // }
    else if (msg.type === 'accept' && proposer_state.state === 'election') {
        proposer_state.accept_count++;

        if (Math.floor(proposer_state.acceptor_count / 2) < proposer_state.accept_count) {
            proposer_state.state = 'success';
            clearTimeout(proposer_state.prepare_timeout_handler);
            proposer_send_learner(ws);
        }
    }
}
