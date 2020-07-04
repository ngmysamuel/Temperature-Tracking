window.onload = function(){
	
	var refButton = document.getElementById("btnButton");
	var refButtonEvent = document.getElementById("btnButtonEvent");
	
	let statusButton = document.getElementById("statusButton");
	
	let actGloButton = document.getElementById("actGlo");
	let deactGloButton = document.getElementById("deactGlo");
	let deactLocButton = document.getElementById("deactLoc");
	
	let globalStatus = document.getElementById("globallockdown")
	let localStatus = document.getElementById("locallockdown");	

	refButton.onclick = function() {
		getData();
	}

	refButtonEvent.onclick = function() {
		getEvent();
	}
	
	statusButton.onclick = function() {
		getGlobalStatus(globalStatus);
		getLocalStatus(localStatus);
	}
	
	actGloButton.onclick = function() {
		activateGlobalLockdown(globalStatus);
	}
	
	deactGloButton.onclick = function() {
		deactivateGlobalLockdown(globalStatus);
	}
	
	deactLocButton.onclick = function() {
		deactivateLocalLockdown(localStatus);
	}
};

async function activateGlobalLockdown(globalStatus) {
	const response = await fetch('http://localhost:5000/api/activategloballockdown');
	getGlobalStatus(globalStatus);
}

async function deactivateGlobalLockdown(globalStatus) {
	const response = await fetch('http://localhost:5000/api/deactivategloballockdown');
	getGlobalStatus(globalStatus);
}

async function deactivateLocalLockdown(localStatus) {
	const response = await fetch('http://localhost:5000/api/deactivatelocallockdown');
	getLocalStatus(localStatus)
}

async function getGlobalStatus(globalStatus) {
	const response = await fetch('http://localhost:5000/api/getGlobalStatus');
	const data = await response.json(); //extract JSON from the http response
	console.log(data)
	globalStatus.innerHTML = data;
}

async function getLocalStatus(localStatus) {
	const response = await fetch('http://localhost:5000/api/getLocalStatus');
	const data = await response.json(); //extract JSON from the http response
	console.log(data)
	localStatus.innerHTML = data;
}

async function getData() {
	const response = await fetch('http://localhost:5000/api/getData');
	const data = await response.json(); //extract JSON from the http response
	console.log(data)
	var tableRef = document.getElementById('table').getElementsByTagName('tbody')[0];
	// let json = JSON.parse(data)
	let json = data
	
	var table = document.getElementById("table");
    var row = table.getElementsByTagName('tr');
	for (let i of row) {
		deleteRow("table");
	}
	
	for (let r of json) {
		console.log(r);
		//
		let issick = "N"
		if (r["averagetemp"] > 38) {
			issick = "Y";
		}
		// Insert a row in the table at the last row
		var newRow   = tableRef.insertRow();
		// Insert a cell in the row at index 0
		var newCell0  = newRow.insertCell(0);
		var newCell1  = newRow.insertCell(1);
		var newCell2  = newRow.insertCell(2);
		var newCell3  = newRow.insertCell(3);
		var newCell4  = newRow.insertCell(4);
		var newCell5  = newRow.insertCell(5);
		var newCell6  = newRow.insertCell(6);
		// Append a text node to the cell
		var newText0 = document.createTextNode(r["deviceid"]);
		var newText1 = document.createTextNode(r["trackername"]);
		var newText2 = document.createTextNode(r["averagetemp"]);
		var newText3 = document.createTextNode(r["isintruder"]);
		var newText4 = document.createTextNode(r["radioGroup"]);
		var newText5 = document.createTextNode(r["timestamp"]);
		var newText6 = document.createTextNode(issick);
		newCell0.appendChild(newText0);
		newCell1.appendChild(newText1);
		newCell2.appendChild(newText2);
		newCell3.appendChild(newText3);
		newCell4.appendChild(newText4);
		newCell5.appendChild(newText5);
		newCell6.appendChild(newText6);
	}
}

async function getEvent() {
	const response = await fetch('http://localhost:5000/api/getEvent');
	const data = await response.json(); //extract JSON from the http response
	console.log(data)
	var tableRef = document.getElementById('eventTable').getElementsByTagName('tbody')[0];
	let json = data
	
	var table = document.getElementById("eventTable");
    var row = table.getElementsByTagName('tr');
	for (let i of row) {
		deleteRow("eventTable");
	}
	for (let r of json) {
		console.log(r);
		//
		let issick = "N"
		if (r["averagetemp"] > 38) {
			issick = "Y";
		}
		// Insert a row in the table at the last row
		var newRow   = tableRef.insertRow();
		// Insert a cell in the row at index 0
		var newCell0  = newRow.insertCell(0);
		var newCell1  = newRow.insertCell(1);
		var newCell2  = newRow.insertCell(2);
		var newCell3  = newRow.insertCell(3);
		var newCell4  = newRow.insertCell(4);
		// Append a text node to the cell
		var newText0 = document.createTextNode(r["deviceid"]);
		var newText1 = document.createTextNode(r["trackername"]);
		var newText2 = document.createTextNode(r["radioGroup"]);
		var newText3 = document.createTextNode(r["timestamp"]);
		var newText4 = document.createTextNode(r["event"]);
		newCell0.appendChild(newText0);
		newCell1.appendChild(newText1);
		newCell2.appendChild(newText2);
		newCell3.appendChild(newText3);
		newCell4.appendChild(newText4);
	}
}

function addRow(data) {

}


function deleteRow(nameOfTable)
{
      var table = document.getElementById(nameOfTable);
      var row = table.getElementsByTagName('tr');
      if (row.length != '1') {
          row[row.length - 1].outerHTML = '';
      }
}

