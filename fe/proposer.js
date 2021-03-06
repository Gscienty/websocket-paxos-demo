var proposer_state = [ 'prepare', 'election', 'success' ];
var proposer_state = {
    value: 'value: ' + Math.random() * 10000,
    prepare_id: 0,
    promise_max_id: 0,
    state: 'prepare',
    acceptor_count: 0,
    promise_count: 0,
    accept_count: 0,
    prepare_timeout_handler: 0,
};

function proposer_restart_prepare(ws, prepare) {
    proposer_state.prepare_id = prepare;
    proposer_state.promise_max_id = 0;
    proposer_state.state = 'prepare';
    proposer_state.promise_count = 0;
    proposer_state.accept_count = 0;
    clearTimeout(proposer_state.prepare_timeout_handler);

    proposer_send_prepare(ws);
}

function proposer_send_prepare(ws) {
    var msg = {
        type: 'prepare',
        id: proposer_state.prepare_id
    };
    log('send :' + JSON.stringify(msg));
    ws.send(JSON.stringify(msg));
    
    proposer_state.prepare_timeout_handler = setTimeout(function () {
        proposer_restart_prepare(ws, proposer_state.prepare_id + 1);
    }, 1000);
}

function proposer_send_proposal(ws) {
    var msg = {
        type: 'proposal',
        id: proposer_state.prepare_id,
        value: proposer_state.value
    };
    log('send :' + JSON.stringify(msg));
    ws.send(JSON.stringify(msg));

    proposer_state.prepare_timeout_handler = setTimeout(function () {
        proposer_restart_prepare(ws, proposer_state.prepare_id + 1);
    }, 1000);
}

function proposer_send_learner(ws) {
    var msg = {
        type: 'learn',
        value: proposer_state.value
    };
    log('send :' + JSON.stringify(msg));
    ws.send(JSON.stringify(msg));
}

function proposer_receive_message(ws, msg) {
    if (msg.type === 'acceptor_hello') {
        proposer_state.acceptor_count++;
        log('acceptor count: ' + proposer_state.acceptor_count);
    }
    else if (msg.type === 'promise' && proposer_state.state === 'prepare') {
        // promise msg = {
        //  type: 'promise',
        //  max_id: <number>,
        //  value: <string>
        // }

        proposer_state.promise_count++;
        log('promise count: ' + proposer_state.promise_count);

        if (proposer_state.promise_max_id <= msg.max_id && msg.value !== '') {
            proposer_state.value = msg.value;
        }

        if (Math.floor(proposer_state.acceptor_count / 2) < proposer_state.promise_count) {
            log('proposer election');

            proposer_state.state = 'election';
            clearTimeout(proposer_state.prepare_timeout_handler);
            proposer_send_proposal(ws);
        }
    }
    else if (msg.type === 'reject') {
        // reject msg = {
        //  type: 'reject',
        //  max_id: <number>
        // }
        log('reject');
        if (msg.max_id > proposer_state.prepare_id) {
            proposer_restart_prepare(ws, msg.max_id + 1);
        }
    }
    // accept msg = {
    //  type: 'accept'
    // }
    else if (msg.type === 'accept' && proposer_state.state === 'election') {
        proposer_state.accept_count++;
        log('accept count' + proposer_state.accept_count);

        if (Math.floor(proposer_state.acceptor_count / 2) < proposer_state.accept_count) {
            log('success');
            proposer_state.state = 'success';
            clearTimeout(proposer_state.prepare_timeout_handler);
            proposer_send_learner(ws);
        }
    }
}
