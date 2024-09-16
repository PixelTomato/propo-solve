let equation;
let table;

function altArray(level, size) {
    let out = [];

    let char = true;
    let count = 0;

    for (let i = 0; i < size; i++) {
        if (count >= 2 ** level) {
            char = !char;
            count = 0;
        }

        out.push(char);

        count++;
    }

    return out;
}

class TruthTable {
    constructor(proposition, variables) {
        this.variables = variables;
        this.varCount = variables.length;
        this.table = {"values": []};

        for (let i = 0;  i < this.varCount; i++) {
            this.table[variables[i]] = altArray(i, 2 ** this.varCount);
        }

        for (let i = 0; i < 2 ** this.varCount; i++) {
            let tempVars = {};
            for (let a = 0;  a < this.varCount; a++) {
                tempVars[variables[a]] = this.table[variables[a]][i];
            }

            this.table["values"][i] = solve(proposition, tempVars);
        }
    }
}

function getPrec(op) {
    if (op == "=") return 4;
    if (op == "¬") return 3;
    if ("∧∨⊕".includes(op)) return 2;
    if ("→↔".includes(op)) return 1;
}

function findPrec() {
    let prec = 0;
    let maxPrec = 0;
    let index = 0;

    for (let i = 0; i < equation.length; i++) {
        let op = equation[i];
        if (op == "(") {
            prec += 5;
        } else if (op == ")") {
            prec -= 5;
        } else if ("=¬∧∨⊕→↔".includes(op)) {
            let globalPrec = prec + getPrec(op);
    
            if (globalPrec > maxPrec) {
                index = i;
                maxPrec = globalPrec;
            }
        }
    }

    return index;
}

function tidy() {
    let matches = equation.matchAll(/\([TF]\)/g).toArray();

    for (let i = 0; i < Math.min(matches.length, 10); i++) {
        const index = matches[i]["index"];
        equation = equation.substring(0, index) + equation[index + 1] + equation.substring(index + 3);
        matches = equation.matchAll(/\([TF]\)/g).toArray();
    }
}

function applyOp(index) {
    let op = equation[index];
    let left = equation[index - 1] == "T";
    let right = equation[index + 1] == "T";

    let out;

    switch (op) {
        case "=":
            out = (left == right) ? "T" : "F";
            equation = equation.substring(0, index - 1) + out + equation.substring(index + 2);
            break;
        case "¬":
            out = (!right) ? "T" : "F";
            equation = equation.substring(0, index) + out + equation.substring(index + 2);
            break;
        case "∧":
            out = (left && right) ? "T" : "F";
            equation = equation.substring(0, index - 1) + out + equation.substring(index + 2);
            break;
        case "∨":
            out = (left || right) ? "T" : "F";
            equation = equation.substring(0, index - 1) + out + equation.substring(index + 2);
            break;
        case "⊕":
            out = (left ^ right) ? "T" : "F";
            equation = equation.substring(0, index - 1) + out + equation.substring(index + 2);
            break;
        case "→":
            out = (!left || (left && right)) ? "T" : "F";
            equation = equation.substring(0, index - 1) + out + equation.substring(index + 2);
            break;
        case "↔":
            out = (left == right) ? "T" : "F";
            equation = equation.substring(0, index - 1) + out + equation.substring(index + 2);
            break;
        default:
            console.error(`Unknown operator '${op}' at index ${index}`);
            break;
    }
}

function solve(proposition, variables) {
    equation = proposition;

    Object.keys(variables).forEach(name => {
        equation = equation.replaceAll(name, variables[name] ? "T" : "F");
    });

    let maxIters = equation.length;
    let iters = 0;

    while (equation.length > 1 && iters < maxIters) {
        let precIndex = findPrec();
        applyOp(precIndex);
        tidy();
        iters++;
    }

    return equation == "T";
}

function insert(string, position, newString) {
    return string.slice(0, position) + newString + string.slice(position);
}

const propositionInput = document.getElementById("proposition");

document.querySelectorAll(".symbol").forEach(element => {
    element.addEventListener("click", event => {
        let tempProposition = propositionInput.selectionStart;
        propositionInput.value = insert(propositionInput.value, propositionInput.selectionStart, element.innerText);
        propositionInput.focus();
        propositionInput.selectionStart = propositionInput.selectionEnd = tempProposition + 1;
    });
});

document.querySelectorAll(".example").forEach(element => {
    element.addEventListener("click", event => {
        propositionInput.value = element.innerText;
        propositionInput.dispatchEvent(new Event("input"));
    });
});

propositionInput.addEventListener("input", async () => {
    let varNames = [];

    propositionInput.value.split("").forEach(char => {
        if (!varNames.includes(char) && char.match(/[a-z]/)) {
            varNames.push(char);
        }
    });

    table = new TruthTable(propositionInput.value.replaceAll(" ", ""), varNames);

    let tableElement = document.getElementById("truth-table");
    let headElement = document.getElementById("truth-table-head");

    let headerElement = document.createElement("tr");

    for (let i = 0; i < table.varCount; i++) {
        let colElement = document.createElement("th");
        colElement.innerText = table.variables[i];
        headerElement.appendChild(colElement);
    }

    let temp = document.createElement("th");
    temp.innerText = "values";
    headerElement.appendChild(temp);

    tableElement.innerHTML = "";
    headElement.innerHTML = "";
    headElement.appendChild(headerElement);

    for (let row = 0; row < table.table.values.length; row++) {
        let rowElement = document.createElement("tr");

        for (let col = 0; col < table.variables.length; col++) {
            let colElement = document.createElement("td");
            colElement.innerText = table.table[table.variables[col]][row];
            rowElement.appendChild(colElement);
        }

        let temp = document.createElement("td");
        temp.innerText = table.table.values[row];
        rowElement.appendChild(temp);

        tableElement.appendChild(rowElement);
    }
});
