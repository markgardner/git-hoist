var NONE  = exports.NONE  = 0x000000,
	READ  = exports.READ  = 0x000001,
	WRITE = exports.WRITE = 0x000010;

exports.canRead = function(flags) {
	return (flags & READ) === READ;
}

exports.canWrite = function(flags) {
	return (flags & WRITE) === WRITE;
}