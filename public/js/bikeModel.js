$(document).ready(function() {

function Bike(data) {
	this.brand = ko.observable(data.brand);
	this.model = ko.observable(data.model);
	this.year = ko.observable(data.year);
	this.type = ko.observable(data.type);
	this.id = ko.observable(data._id);
	this.img = ko.observable(data.img);
	
	this.displayName = ko.computed(function() {
		return this.year() + " " + this.brand() + " " + this.model();
	}, this);
}

function BikeViewModel() {
	var self = this;
	self.bikes = ko.observableArray([]);
	self.selectedBike = ko.observable();
	
	//retrieves bike objects from database and maps them to the ko BikeViewModel class
	$.getJSON('/bikeList', function(allData) {
	    var mappedBikes = $.map(allData, function(item) { return new Bike(item) });
		self.bikes(mappedBikes);
	});

	//Removes the bike from the database and ko binding collection (not finished)
	self.removeBike = function(bike) {
		$.post("/removeBike/:" + bike.id(), function() {
			self.bikes.remove(bike);
		});
	};
}

	ko.applyBindings(new BikeViewModel());
});