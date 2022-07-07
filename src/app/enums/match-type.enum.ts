export enum MatchTypes {
    SHOT = 'shot',
    PASS = 'pass',
    PUCKWON = 'puckWon',
    ZONE_ENTRY = 'zoneEntry',
    ZONE_EXIT = 'zoneExit',
    DUMP_OUT = 'dumpOut',
    OFFENSIVE_ZONE_LOSS = 'offensiveZoneLoss',
    HIT = 'hit',
    SHOOTOUT = 'shootout',
    PENALTY = 'penalty'
}

export enum EventType {
    SHOT = 'STŘELA',
    PASS = 'PŘIHŘÁVKA',
    PUCKWON = 'ZISK PUKU',
    ZONEENTRY = 'VSTUP DO PÁSMA',
    ZONEEXIT = 'VÝSTUP Z PÁSMA',
    DUMPOUT = 'VYHOZENÍ',
    DUMPIN = 'NAHOZENÍ',
    SHIFT = 'STŘÍDÁNÍ',
    THROWING = 'NESPECIFIKOVANE',
    FACEOFF = 'VHAZOVÁNÍ',
    HIT = 'SRÁŽKA'
}



export enum EventKey {
    SHOTS = 'strely',
    PASSES = 'prihravky',
    ENTRIES = 'vstupy_do_pasma',
    EXITS = 'vystupy_z_pasma',
    SHOOTOUTS = "najezdy" ,
    FACEOFFS = 'vhazovani',
}
