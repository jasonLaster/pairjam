var notice = require('./notifications.jsx');
var util = require('./util.js');

// TODO: adapter should be smarter about marker updates

module.exports = function(model, view) {
	return {
		// Connection level
		opened: function() {
			view.notify( notice.connected() );
		},

		reconnecting: function(time) {
			view.notify( notice.lostConnection(time) );
		},

		closed: function(data) {},

		// Joining and leaving
		welcome: function(data) {
			model.reset(data);
			view.setProps( {clients: model.getPeers()} );
		},

		joined: function(data) {
			model.addPeer( data );

			view.setProps( {clients: model.getPeers()} );

			// Someone else joined
			if(data.id !== model.clientId) {
				view.notify( notice.joined(data.name) );
			}

			view.updateCursors( model.getCursors() );
		},

		left: function(data) {
			model.removePeer(data);

			view.setProps( {clients: model.getPeers()} );
			view.notify( notice.left(data.name) );
			view.updateCursors( model.getCursors() );
		},

		// Workspace change functions
		reqDoc: function(data) {
			if(data.error) {
				view.notify( notice.error(data.error) );
			} else {
				view.notify( notice.loading(data.filename) );
			}
		},

		reqWorkspace: function(data) {
			if(data.error) {
				view.notify( notice.error(data.error) );
			} else {
				view.notify( notice.loading(data.user + '/' + data.repo, ' from GitHub') );
			}
		},

		setDoc: function(data) {
			model.setDoc( data.doc, data.rev, data.sels );

			view.updateDoc( data.doc, data.filename, data.filepath );
			view.updateCursors( model.getCursors() );
		},

		setWorkspace: function(data) {
			var tree = data.tree;
			view.setWorkspace( {'user': data.user, 'repo': data.repo, 'tree': tree} );
		},

		setWorkTreeState: function(data) {
			var tree = view.state.tree;
			util.setKeyOnTreePath(tree, data.path, 'opened', data.isopen);
			view.setState( {'tree': tree} );
		},

		// Operations
		opText: function(data) {
			var op = model.applyExternalOp( data );
			if(op.length) view.applyOp( op );
			view.updateCursors( model.getCursors() );
		},

		opCursor: function(data) {
			model.applyExternalSel( data );
			view.updateCursors( model.getCursors() );
		}

	};
};