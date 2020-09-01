module.exports = function PartyDeathMarkers(mod){
	let members = [];
	let markers = [];

	mod.game.on('enter_game', removeAllMarkers);

	mod.hook('S_PARTY_MEMBER_LIST', 7, event => {
		members = event.members;
	});

	mod.hook('S_DEAD_LOCATION', 2, event => {
		spawnMarker(members.find(member => member.gameId === event.gameId), event.loc);
	});

	mod.hook('S_SPAWN_USER', 15, event => {
		if(!event.alive){spawnMarker(members.find(member => member.gameId === event.gameId), event.loc);}
	});

	mod.hook('S_PARTY_MEMBER_STAT_UPDATE', 3, event => {
		if(mod.game.me.playerId === event.playerId){return;}

		if(markers.length > 0 && event.alive && event.curHp > 0){removeMarker(members.find(member => member.playerId === event.playerId));}
	});

	mod.hook('S_LEAVE_PARTY_MEMBER', 2, event => {
		removeMarker(members.find(member => member.playerId === event.playerId));
	});

	mod.hook('S_LEAVE_PARTY', 1, () => {
		removeAllMarkers();
		members = [];
	});

	function spawnMarker(member, loc){
		if(!member || mod.game.me.is(member.gameId)){return;}

		removeMarker(member);
		markers.push(member.playerId);

		mod.toClient('S_SPAWN_DROPITEM', 8, {
			gameId: member.playerId,
			loc: loc,
			item: getMarker(member.class),
			amount: 1,
			expiry: 999999,
			owners: [{ playerId: mod.game.me.playerId }]
		});
	}
	function getMarker(classid){
		let markerID;
		switch(classid){
			// Tanks: Brawler & Lancer, No Warrior tank or Bezerker tank
			case 1:
			case 10:
				markerID = 89542; // Blue Beacon
				break;

				// Healers: Mystic & Priest
			case 6:
			case 7:
				markerID = 89543; // Purple Beacon
				break;

				// Everyone else, No DPS Brawler
			default:
				markerID = 206960; // Red Beacon
				break;
		}
		return markerID;
	}

	function removeMarker(member){
		if(!member){return;}

		const id = member.playerId;
		if(markers.includes(id)){
			mod.toClient('S_DESPAWN_DROPITEM', 4, {
				gameId: id
			});
			markers = markers.filter(marker => marker !== id);
		}
	}

	function removeAllMarkers(){
		members.forEach(member => removeMarker(member));
		markers = [];
	}
};
