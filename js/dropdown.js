// Oscar Saharoy 2021

const displayButton = document.querySelector( "#dropdown-inner button.display" ); 
const outerDiv      = document.querySelector( "#dropdown-inner" );
const innerButtons  = Array.from( document.querySelectorAll( "#dropdown-inner button.option" ) );

innerButtons.forEach( elm => elm.addEventListener( "click", () => onButtonClick(elm) ) );
innerButtons.forEach( elm => elm.addEventListener( "pointerdown", () => onButtonPointerDown(elm) ) );
// innerButtons.forEach( elm => elm.addEventListener( "click", e => elm.focus() ) );


function onButtonClick( elm ) {
	
	displayButton.innerHTML = elm.innerHTML;

	document.activeElement.blur();
}

function onButtonPointerDown( elm ) {

	// make the clicked button the selected one
	innerButtons.forEach( elm => elm.classList.remove("selected") );
	elm.classList.add( "selected" );

	// apply the preset for that button if its not the custom button
	
	let buttonText = elm.innerHTML;	
	if( buttonText != "custom" )
		
		applyPreset( presetsData[elm.innerHTML] );
}
