
    function onChangeEmail() {

        toggleEmailErros();
        toggleButtonsDisable();
        
    }

    function onChangePassword() { 


    toggleButtonsDisable();
    togglePasswordErrors();

}

    
    function validateEmail(email) {
        return /\S+@\S+\.\S+/.test(email);
    }
    
    window.onload = function() {
        document.getElementById("email").addEventListener("input", validateFields);
    };


    function toggleEmailErros() { 
        const email = document.getElementById(`email`).value
        if (!email) { 
            document.getElementById(`email-required-error`).style.display = "block";
        } else { 
            document.getElementById(`email-required-error`).style.display = "none"
         }

         if(validateEmail (email)) { 
            document.getElementById(`email-invalid-error`).style.display = "none";
         }else { document.getElementById(`email-invalid-error`).style.display = "block";
        
        }
    
    }

    function togglePasswordErrors() { 
        const password = document.getElementById(`password`).value;
        if (!password) { 
            document.getElementById(`password-required-error`).style.display = "block";
        } else { 
            document.getElementById(`password-required-error`).style.display = "none";
         }





            
    }

    function toggleButtonsDisable () { 

        const email = document.getElementById("email").value;
        const isValidEmail = validateEmail(email);
        document.querySelector(".clear").disabled = !isValidEmail;
        document.querySelector(".solid").disabled = !isValidEmail;


    }


