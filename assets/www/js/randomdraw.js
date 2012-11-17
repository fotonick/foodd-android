var randomdraw = function(scores) {
    // find the range of lottery numbers
    var sum = 0;
    for (var i=0; i < scores.length; i++) {
        sum += scores[i];
    }

    // draw
    var winning_ticket = Math.floor(sum * Math.random());

    // determine winner
    sum = 0;
    for (var i=0; i < scores.length; i++) {
        sum += scores[i];
        if (sum > winning_ticket) {
            return i;
        }
    }
    return -1;  // should never get here
}
