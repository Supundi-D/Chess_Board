const board = document.getElementById("board");
const turnText = document.getElementById("turn");
const whiteCaptured = document.getElementById("whiteCaptured");
const blackCaptured = document.getElementById("blackCaptured");

let selected = null;
let currentTurn = "white";
const squares = [];

const moved = {
    wK: false, bK: false,
    wRL: false, wRR: false,
    bRL: false, bRR: false
};

const pieces = [
    "♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜",
    "♟","♟","♟","♟","♟","♟","♟","♟",
    "", "", "", "", "", "", "", "",
    "", "", "", "", "", "", "", "",
    "", "", "", "", "", "", "", "",
    "", "", "", "", "", "", "", "",
    "♙","♙","♙","♙","♙","♙","♙","♙",
    "♖","♘","♗","♕","♔","♗","♘","♖"
];

// Create board squares
pieces.forEach((p, i) => {
    const sq = document.createElement("div");
    sq.className = "square " + (((Math.floor(i / 8) + i) % 2 === 0) ? "white" : "black");
    sq.textContent = p;
    sq.dataset.index = i;
    sq.onclick = () => clickSquare(sq);
    board.appendChild(sq);
    squares.push(sq);
});

function clickSquare(t) {
    if (!selected) {
        if (t.textContent && isCorrectTurn(t.textContent)) {
            selected = t; t.classList.add("selected");
        }
        return;
    }

    const from = +selected.dataset.index;
    const to = +t.dataset.index;
    const piece = selected.textContent;
    const captured = t.textContent;

    if (isCastling(piece, from, to)) {
        doCastling(piece, to);
        switchTurn();
    }
    else if (isValidMove(piece, from, to)) {
        if (wouldLeaveKingInCheck(from, to, currentTurn)) {
            alert("Illegal move! Your king would be in check.");
            selected.classList.remove("selected");
            selected = null;
            return;
        }

        if (captured) {
            ("♙♖♘♗♕♔".includes(captured) ? whiteCaptured : blackCaptured).textContent += captured;
        }

        t.textContent = piece;
        selected.textContent = "";
        markMoved(piece, from);

        // Pawn promotion
        if ((piece === "♙" && to <= 7) || (piece === "♟" && to >= 56)) {
            promotePawn(to, piece);
        }

        switchTurn();
    }

    selected.classList.remove("selected");
    selected = null;

    highlightCheck();
    checkGameEnd();
}

function switchTurn() {
    currentTurn = currentTurn === "white" ? "black" : "white";
    turnText.textContent = "Turn: " + (currentTurn === "white" ? "White" : "Black");
}

function isCorrectTurn(p) {
    return currentTurn === "white"
        ? "♙♖♘♗♕♔".includes(p)
        : "♟♜♞♝♛♚".includes(p);
}

/* ---------------- CASTLING ---------------- */

function isCastling(piece, from, to) {
    if (isKingInCheck(currentTurn)) return false;

    if (piece === "♔" && from === 60 && !moved.wK) {
        if (to === 62 && !moved.wRR && isEmpty(61) && isEmpty(62)
            && !isSquareAttacked(61, "black") && !isSquareAttacked(62, "black")) return true;
        if (to === 58 && !moved.wRL && isEmpty(59) && isEmpty(58) && isEmpty(57)
            && !isSquareAttacked(59, "black") && !isSquareAttacked(58, "black")) return true;
    }

    if (piece === "♚" && from === 4 && !moved.bK) {
        if (to === 6 && !moved.bRR && isEmpty(5) && isEmpty(6)
            && !isSquareAttacked(5, "white") && !isSquareAttacked(6, "white")) return true;
        if (to === 2 && !moved.bRL && isEmpty(3) && isEmpty(2) && isEmpty(1)
            && !isSquareAttacked(3, "white") && !isSquareAttacked(2, "white")) return true;
    }
    return false;
}

function doCastling(piece, to) {
    if (piece === "♔") {
        squares[60].textContent = "";
        squares[to].textContent = "♔";
        if (to === 62) { squares[63].textContent = ""; squares[61].textContent = "♖"; }
        else { squares[56].textContent = ""; squares[59].textContent = "♖"; }
        moved.wK = true;
    }
    if (piece === "♚") {
        squares[4].textContent = "";
        squares[to].textContent = "♚";
        if (to === 6) { squares[7].textContent = ""; squares[5].textContent = "♜"; }
        else { squares[0].textContent = ""; squares[3].textContent = "♜"; }
        moved.bK = true;
    }
}

/* ---------------- CHECK & ATTACK ---------------- */

function isKingInCheck(color) {
    const king = color === "white" ? "♔" : "♚";
    const kIndex = squares.findIndex(s => s.textContent === king);
    return isSquareAttacked(kIndex, color === "white" ? "black" : "white");
}

function isSquareAttacked(index, byColor) {
    return squares.some((sq, i) => {
        if (!sq.textContent) return false;
        if (byColor === "white" && !"♙♖♘♗♕♔".includes(sq.textContent)) return false;
        if (byColor === "black" && !"♟♜♞♝♛♚".includes(sq.textContent)) return false;
        return isValidMove(sq.textContent, i, index, true);
    });
}

function highlightCheck() {
    squares.forEach(sq => sq.style.backgroundColor = sq.classList.contains("white") ? "#f0d9b5" : "#b58863");

    ["white", "black"].forEach(color => {
        if (isKingInCheck(color)) {
            const king = color === "white" ? "♔" : "♚";
            const kIndex = squares.findIndex(sq => sq.textContent === king);
            squares[kIndex].style.backgroundColor = "red";
        }
    });
}

/* ---------------- NORMAL MOVES ---------------- */

function isValidMove(piece, from, to, attackCheck = false) {
    const fr = Math.floor(from / 8), fc = from % 8;
    const tr = Math.floor(to / 8), tc = to % 8;
    const rd = tr - fr, cd = tc - fc;
    const ar = Math.abs(rd), ac = Math.abs(cd);
    const target = squares[to].textContent;
    if (!attackCheck && target && isCorrectTurn(target)) return false;

    if (piece === "♙") {
        if (fc === tc && !target && ((fr === 6 && rd === -2 && isEmpty(from - 8)) || rd === -1)) return true;
        if (ac === 1 && rd === -1 && target) return true;
    }
    if (piece === "♟") {
        if (fc === tc && !target && ((fr === 1 && rd === 2 && isEmpty(from + 8)) || rd === 1)) return true;
        if (ac === 1 && rd === 1 && target) return true;
    }
    if ("♖♜".includes(piece)) return (fr === tr || fc === tc) && clearPath(from, to);
    if ("♗♝".includes(piece)) return ar === ac && clearPath(from, to);
    if ("♕♛".includes(piece)) return (fr === tr || fc === tc || ar === ac) && clearPath(from, to);
    if ("♘♞".includes(piece)) return (ar === 2 && ac === 1) || (ar === 1 && ac === 2);
    if ("♔♚".includes(piece)) return ar <= 1 && ac <= 1;
    return false;
}

function markMoved(p, f) {
    if (p === "♔") moved.wK = true;
    if (p === "♚") moved.bK = true;
    if (p === "♖" && f === 56) moved.wRL = true;
    if (p === "♖" && f === 63) moved.wRR = true;
    if (p === "♜" && f === 0) moved.bRL = true;
    if (p === "♜" && f === 7) moved.bRR = true;
}

function isEmpty(i) { return squares[i].textContent === ""; }

function clearPath(from, to) {
    const fr = Math.floor(from / 8), fc = from % 8;
    const tr = Math.floor(to / 8), tc = to % 8;
    const sr = Math.sign(tr - fr), sc = Math.sign(tc - fc);
    let r = fr + sr, c = fc + sc;
    while (r !== tr || c !== tc) {
        if (squares[r * 8 + c].textContent !== "") return false;
        r += sr; c += sc;
    }
    return true;
}

/* ---------------- CHECKMATE LOGIC ---------------- */

function checkGameEnd() {
    const enemy = currentTurn; // current player is enemy
    if (isKingInCheck(enemy)) {
        if (!hasAnyLegalMove(enemy)) {
            setTimeout(() => {
                alert("CHECKMATE! " + (enemy === "white" ? "Black" : "White") + " wins ♟️");
            }, 100);
        } else {
            turnText.textContent = "Turn: " + (currentTurn === "white" ? "White" : "Black") + " (Check!)";
        }
    } else {
        if (!hasAnyLegalMove(enemy)) {
            setTimeout(() => {
                alert("STALEMATE! It's a draw.");
            }, 100);
        }
    }
}

function hasAnyLegalMove(color) {
    for (let from = 0; from < 64; from++) {
        const piece = squares[from].textContent;
        if (!piece) continue;
        if (color === "white" && !"♙♖♘♗♕♔".includes(piece)) continue;
        if (color === "black" && !"♟♜♞♝♛♚".includes(piece)) continue;

        for (let to = 0; to < 64; to++) {
            if (from === to) continue;
            if (isValidMove(piece, from, to)) {
                if (!wouldLeaveKingInCheck(from, to, color)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function wouldLeaveKingInCheck(from, to, color) {
    const fromSq = squares[from];
    const toSq = squares[to];
    const movingPiece = fromSq.textContent;
    const capturedPiece = toSq.textContent;

    fromSq.textContent = "";
    toSq.textContent = movingPiece;

    const stillInCheck = isKingInCheck(color);

    fromSq.textContent = movingPiece;
    toSq.textContent = capturedPiece;

    return stillInCheck;
}

/* ---------------- PAWN PROMOTION ---------------- */
function promotePawn(index, pawn) {
    let promotedPiece = "";
    if (pawn === "♙") {
        promotedPiece = prompt("Promote White pawn to (Q/R/B/N):", "Q");
        promotedPiece = promotedPiece?.toUpperCase();
        if (promotedPiece === "R") squares[index].textContent = "♖";
        else if (promotedPiece === "N") squares[index].textContent = "♘";
        else if (promotedPiece === "B") squares[index].textContent = "♗";
        else squares[index].textContent = "♕"; // default Queen
    } else {
        promotedPiece = prompt("Promote Black pawn to (Q/R/B/N):", "Q");
        promotedPiece = promotedPiece?.toUpperCase();
        if (promotedPiece === "R") squares[index].textContent = "♜";
        else if (promotedPiece === "N") squares[index].textContent = "♞";
        else if (promotedPiece === "B") squares[index].textContent = "♝";
        else squares[index].textContent = "♛"; // default Queen
    }
}