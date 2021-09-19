// Oscar Saharoy 2021

// get the buttons
const displayButton = document.querySelector( "#dropdown-inner button.display" ); 
const innerButtons  = Array.from( document.querySelectorAll( "#dropdown-inner button.option" ) );

// add button callbacks
innerButtons.forEach( elm => elm.addEventListener( "click", () => onButtonClick(elm) ) );
innerButtons.forEach( elm => elm.addEventListener( "pointerdown", evt => onButtonPointerDown(elm, evt) ) );
displayButton.addEventListener( "click", e => displayButton.focus() ); // for safari


function onButtonClick( elm ) {

	// defocus to close the dropdown
	document.activeElement.blur();
}

function onButtonPointerDown( elm, evt ) {

	// release the pointer capture
	elm.releasePointerCapture( evt.pointerId );

	// make the clicked button the selected one
	innerButtons.forEach( elm => elm.classList.remove("selected") );
	elm.classList.add( "selected" );
	
	// set the display button's text to that of the button we just clicked
	displayButton.innerHTML = elm.innerHTML;

	// apply the preset for that button if its not the custom button	
	if( elm.innerHTML == "custom" ) return;
	
	applyPreset( presetsData[elm.innerHTML] );
}
