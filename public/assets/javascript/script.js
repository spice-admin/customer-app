//  Onboarding Screen
$(".skip_btn_1").click(function () {

    $("#first").removeClass("active");
    $(".first_slide").removeClass("active");

    $("#second").addClass("active");
    $(".second_slide").addClass("active");
});

$(".skip_btn_2").click(function () {
    $("#second").removeClass("active");
    $(".second_slide").removeClass("active");

    $("#third").addClass("active");
    $(".third_slide").addClass("active");
});

// Add Home Screen Pop Up Screen
$(document).ready(function () {
    $("#bkgOverlay").delay(4800).fadeIn(400);
    $("#delayedPopup").delay(5000).fadeIn(400);
    $("#btnClose").click(function (e) {
        HideDialog();
        e.preventDefault();
    });
});
function HideDialog() {
    $("#bkgOverlay").fadeOut(400);
    $("#delayedPopup").fadeOut(300);
}

// Add Home Screen Button Loader 
$(document).ready(function () {
    $('.btn-process').on('click', function () {
        $(".btn-ring").show();
        $(".btn-process").prop('disabled', true);
        $(".btn-process").val('disabled');
        setTimeout(function () {
            $(".btn-ring").hide();
            $(".btn-process").prop('disabled', false);
        }, 2000);
    });
});


// Splash Screen Preloader
$(window).on("load", function () {
    $('.circle').fadeOut();
    $('.loader-mask').delay(350).fadeOut('slow');
});

$(window).on("load", function () {
    $('.loader-mask1').delay(2000).fadeOut(2500);

});

// All Page loader
$(window).on('load', function () {
    $('.loader').fadeOut(2500);
});

//  Sticky Header
$(window).scroll(function () {
    var scrollPosition = $(window).scrollTop();
    if (scrollPosition >= 20) {
        $('#top-header, #top-navbar').addClass('fixed');
        $('.Amigo_img_main').css('padding-top', '70px');
    } else {
        $('#top-header, #top-navbar').removeClass('fixed');
        $('.Amigo_img_main').css('padding-top', '0');
    }
});

// New Password hide show button
$("#eye ,#eye1").click(function () {
    $(this).toggleClass("fa-eye fa-eye-slash");
    input = $(this).parent().find("input");
    if (input.attr("type") == "password") {
        input.attr("type", "text");
    } else {
        input.attr("type", "password");
    }
});

// Confirm OTP Input filed 
function validateInput(input) {
    input.value = input.value.replace(/\D/g, '');
    if (input.value.length > 1) {
        input.value = input.value[0];
    }
}

// Fingerprint Screen Pop-Up page redirect
$(".print-continue-btn").on("click", function () {
    $('.loader2').fadeIn();
    $('.loader2').fadeOut(3000);
    setTimeout(function () {
        window.location = "preferred_language.html";
    }, 2000);
});


//dropdown on click
$(".dropdown_click .selected").on('click', function () {
    var dropdownContent = $(this).closest(".dropdown_click").find(".drop-content ul");
    dropdownContent.slideToggle();
});

$(".dropdown_click .drop-content ul li span").on('click', function () {
    var selectedElement = $(this).closest(".dropdown_click").find(".selected span");
    var dropdownContent = $(this).closest(".dropdown_click").find(".drop-content ul");

    selectedElement.html($(this).html());
    dropdownContent.slideUp();
});

// Dark Light Mode Toggle
function myFunction() {
    var element = document.body;
    var toggleCheckbox = document.getElementById("toggle");
    var modeText = document.getElementById("modeText");

    if (toggleCheckbox) {
        element.classList.toggle("dark-mode", toggleCheckbox.checked);

        if (toggleCheckbox.checked === true) {
            localStorage.setItem("mode", "dark");
        } else {
            localStorage.setItem("mode", "light");
        }
        modeText.textContent = toggleCheckbox.checked ? "Dark Mode" : "Light Mode";
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const storedMode = localStorage.getItem("mode");
    if (storedMode === "dark") {
        document.body.classList.add("dark-mode");
        var toggleCheckbox = document.getElementById("toggle");
        if (toggleCheckbox) {
            toggleCheckbox.checked = true;
        }
    }
    myFunction();
});

var toggleCheckbox = document.getElementById("toggle");
if (toggleCheckbox) {
    toggleCheckbox.addEventListener("change", myFunction);
}



// Slider Home Screen
$(document).ready(function () {
    $('.special-offers-slider').slick({
        infinity: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        arrows: false,
        variableWidth: true,
        dots: true,
        speed: 1000,
    });

    $('.trending-meals-main-box').slick({
        infinite: false,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: false,
        arrows: false,
        variableWidth: true,
        dots: false,
    });

    $('.special-offers-slider2').slick({
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: false,
        arrows: false,
        dots: true,
        speed: 1000,
    });
});

// food tabs 
$(function () {
    $('nav a').click(function () {
        var tabId = $(this).attr('data-tab');

        $('nav a').removeClass('active');
        $('.Tabcondent').removeClass('active');

        $(this).addClass('active');
        $('#' + tabId).addClass('active');
    });

});

// Search Screen Search food
document.addEventListener('DOMContentLoaded', function () {
    const foods = ['Cheez Hotdog', 'Pizza', 'Burger', 'Pasta', 'Salad', 'Sushi', 'Taco', 'Steak', 'Sandwich', 'Soup', 'Manchurian', 'Hot fire Pizza', 'Grill Sandwich', 'Paper Dosa', 'Italian Hotdog', 'Fish Biryani', 'Egg Biryani', 'Biryani'];
    const searchBar = document.getElementById('searchBar');
    const suggestions = document.getElementById('suggestions');

    if (searchBar && suggestions) {
        searchBar.addEventListener('input', () => {
            const searchTerm = searchBar.value.trim();
            if (searchTerm === '') {
                suggestions.innerHTML = '';
            } else {
                renderSuggestions(searchTerm);
            }
        });
    }

    function renderSuggestions(searchTerm) {
        const matchingFoods = foods.filter(food => food.toLowerCase().includes(searchTerm.toLowerCase()));
        suggestions.innerHTML = '';
        if (matchingFoods.length > 0) {
            matchingFoods.forEach(food => {
                const suggestionElement = document.createElement('div');
                suggestionElement.classList.add('suggestion');
                suggestionElement.textContent = food;
                suggestionElement.addEventListener('click', () => {
                    console.log('Redirect to page for: ' + food);
                });
                suggestions.appendChild(suggestionElement);
            });
        } else {
            window.location.href = '404.html';
        }
    }
});

// like Button Heart
$(function () {
    $(".like-heart").click(function () {
        $(this).toggleClass("press");
    });
});

// home input click redirect search page
function openSearchPage() {
    window.location.href = 'search.html';
}

// Filter screen search dropdown
function updateButtonText(event) {
    const selectedOption = event.target.textContent;
    document.getElementById('dropdownButton').textContent = selectedOption;
}

// Radio Button check
$(document).ready(function () {
    $('.form-check-input-radio:eq(1)').prop('checked', true).change();
    updateStyles($('.form-check-input-radio:eq(1)'));
    updateCustomizedPrice($('.form-check-input-radio:eq(1)'));

    $('.verify-section-main').click(function () {
        var radioButton = $(this).find('.form-check-input-radio');
        radioButton.prop('checked', true).change();
        updateStyles(radioButton);
        updateCustomizedPrice(radioButton);
    });

    $('.form-check-input-radio').click(function (event) {
        event.stopPropagation();
    });

    $('.form-check-input-radio').change(function () {
        updateStyles($(this));
        updateCustomizedPrice($(this));
    });

    $('#continueButton').click(function () {
        var anyRadioChecked = $('.form-check-input-radio:checked').length > 0;

        if (anyRadioChecked) {
            window.location.href = 'cart.html';
        } else {
            window.location.href = 'empty_cart.html';
        }
    });

    function updateStyles(radioButton) {
        $('.verify-section-main').css('background-color', '');
        $('.privacy_manage, .leave-text').css('color', '');

        if (radioButton.is(':checked')) {
            radioButton.closest('.verify-section-main').css('background-color', '#FF4C3B');
            radioButton.closest('.verify-section-main').find('.privacy_manage, .leave-text').css('color', '#FFF');
        }
    }

    function updateCustomizedPrice(radioButton) {
        var leaveText = radioButton.closest('.verify-section-main').find('.leave-text').text();
        var priceElement = $('.customized-items-price');

        if (radioButton.is(':checked')) {
            priceElement.text(leaveText);
        } else {
            priceElement.text('0');
        }
    }
});

// Share pop up
const viewBtn = document.querySelector(".view-modal");
const overlay2 = document.querySelector(".overlay2");

if (viewBtn) {
    viewBtn.onclick = () => {
        const popup = document.querySelector(".popup");
        const close = popup.querySelector(".close");
        const field = popup.querySelector(".field");
        const input = field.querySelector("input");
        const copy = field.querySelector("button");

        popup.classList.toggle("show");
        overlay2.classList.toggle("show");

        close.onclick = () => {
            viewBtn.click();
        }

        copy.onclick = () => {
            input.select();
            if (document.execCommand("copy")) {
                field.classList.add("active");
                copy.innerText = "Copied";
                setTimeout(() => {
                    window.getSelection().removeAllRanges();
                    field.classList.remove("active");
                    copy.innerText = "Copy";
                }, 3000);
            }
        }
    }
}

// Store the original value
var originalValueElement = document.querySelector('.mexican_fiesta_amount');
var originalValue = originalValueElement ? parseFloat(originalValueElement.innerHTML) : 0;

var currentValue = 1;

function updateAmount(value) {
    updateMexicanFiestaAmount(value);

    updateItemPrice(value);

    updateTotal();

    updateNumber();
}

function updateMexicanFiestaAmount(value) {
    const amountElement = document.querySelector('.mexican_fiesta_amount');
    if (amountElement) {
        amountElement.innerHTML = value.toFixed(2);
    }
}

function updateItemPrice(value) {
    var itemPriceElement = document.getElementById("itemPrice");
    if (itemPriceElement) {
        itemPriceElement.innerText = value.toFixed(2);
    }
}

function updateNumber() {
    var numberElement = document.querySelector('.increase_decrease_number');
    if (numberElement) {
        numberElement.innerHTML = currentValue;
    }
}

function increaseValue() {
    const amountElement = document.querySelector('.mexican_fiesta_amount');
    if (amountElement) {
        var value = parseFloat(amountElement.innerHTML);

        if (!isNaN(value)) {
            currentValue++;
            updateAmount(value + originalValue);
        }
    }
}

function decreaseValue() {
    const amountElement = document.querySelector('.mexican_fiesta_amount');
    if (amountElement) {
        var value = parseFloat(amountElement.innerHTML);

        if (!isNaN(value) && value > originalValue) {
            currentValue--;
            updateAmount(value - originalValue);
        }
    }
}

function updateTotal() {
    var itemPriceElement = document.getElementById("itemPrice");
    var deliveryPriceElement = document.getElementById("deliveryPrice");
    var otherChargesPriceElement = document.getElementById("otherChargesPrice");
    var offersPriceElement = document.getElementById("offersPrice");
    var totalAmountElement = document.getElementById("totalAmount");
    var paidAmountElement = document.getElementById("paidAmount");

    if (itemPriceElement && deliveryPriceElement && otherChargesPriceElement && offersPriceElement && totalAmountElement && paidAmountElement) {
        var itemPrice = parseFloat(itemPriceElement.innerText);
        var deliveryPrice = parseFloat(deliveryPriceElement.innerText);
        var otherChargesPrice = parseFloat(otherChargesPriceElement.innerText);
        var offersPrice = parseFloat(offersPriceElement.innerText);
        var totalAmount = itemPrice + deliveryPrice + otherChargesPrice - offersPrice;

        totalAmountElement.innerText = totalAmount.toFixed(2);
        paidAmountElement.innerText = totalAmount.toFixed(2);
    }
}

updateTotal();

// Copy Coupon code
function copyCouponCode(couponId) {
    var couponCodeElement = document.getElementById(couponId);
    var copyMessageElement = document.getElementById("copyMessage");
    var range = document.createRange();
    range.selectNode(couponCodeElement);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);

    document.execCommand("copy");

    window.getSelection().removeAllRanges();

    copyMessageElement.style.opacity = 1;

    setTimeout(function () {
        copyMessageElement.style.opacity = 0;
    }, 2000);
}

// like dislike buttons
document.addEventListener('DOMContentLoaded', function () {
    var buttons = document.querySelectorAll('.like-dislike-btns');

    buttons.forEach(function (button) {
        button.addEventListener('click', function () {
            var countSpan = this.querySelector('span');
            var currentCount = parseInt(countSpan.textContent);

            if (this.classList.contains('green')) {
                currentCount -= 1;
                this.classList.remove('green');
            } else {
                currentCount += 1;
                this.classList.add('green');

                var otherButton = (this.id.includes('green')) ? document.getElementById(this.id.replace('green', 'red')) : document.getElementById(this.id.replace('red', 'green'));
                if (otherButton && otherButton.classList.contains('red')) {
                    var otherCountSpan = otherButton.querySelector('span');
                    otherCountSpan.textContent = parseInt(otherCountSpan.textContent) - 1;
                    otherButton.classList.remove('red');
                }
            }

            countSpan.textContent = currentCount;

            if (this.classList.contains('red')) {
                this.classList.remove('red');
            } else {
                this.classList.add('red');

                var otherButton = (this.id.includes('red')) ? document.getElementById(this.id.replace('red', 'green')) : document.getElementById(this.id.replace('green', 'red'));
                if (otherButton && otherButton.classList.contains('green')) {
                    var otherCountSpan = otherButton.querySelector('span');
                    otherCountSpan.textContent = parseInt(otherCountSpan.textContent) - 1;
                    otherButton.classList.remove('green');
                }
            }
        });
    });
});

// Personal Info Photo Upload
$(document).ready(function () {
    var readURL = function (input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                $('.profile-pic').attr('src', e.target.result);
            }
            reader.readAsDataURL(input.files[0]);
        }
    }
    $(".file-upload").on('change', function () {
        readURL(this);
    });
    $(".upload-button").on('click', function () {
        $(".file-upload").click();
    });
});


// border selected in mywallet
function selectWallet(element) {
    var wallets = document.querySelectorAll('.Wallet');
    wallets.forEach(function (wallet) {
        wallet.classList.remove('Wallet-border-color');
    });

    element.classList.add('Wallet-border-color');
}

// Driver Has Arrived PopUp Box
setTimeout(function () {
    var overlay = document.getElementById("overlay");
    var popup2 = document.getElementById("popup2");
    if (overlay && popup2) {
        overlay.style.display = "block";
        popup2.style.display = "block";
        setTimeout(function () {
            popup2.classList.add("fadeOut");
            setTimeout(function () {
                overlay.style.display = "none";
                popup2.style.display = "none";
                popup2.classList.remove("fadeOut");
            }, 500);
        }, 5000);
    }
}, 5000);

function closePopup() {
    var overlay = document.getElementById("overlay");
    var popup2 = document.getElementById("popup2");
    if (overlay && popup2) {
        popup2.classList.add("fadeOut");
        setTimeout(function () {
            overlay.style.display = "none";
            popup2.style.display = "none";
            popup2.classList.remove("fadeOut");
        }, 500);
    }
}

// tip screen tip circle bg color change
var activeDiv = null;
function changeColor(element) {
    if (activeDiv !== null) {
        activeDiv.classList.remove('active');
    }

    element.classList.add('active');
    activeDiv = element;
}

// input open and hidden tip screen
function toggleCustomAmountInput() {
    var inputContainer = document.getElementById("customAmountInputContainer");
    inputContainer.style.display = (inputContainer.style.display === "none" || inputContainer.style.display === "") ? "block" : "none";
}

// image and video upload 
function uploadFile(type) {
    var fileInput = document.createElement('input');
    fileInput.type = 'file';

    fileInput.onchange = function () {
        var file = fileInput.files[0];
        if (file) {
            if (type === 'image') {
                displayImagePreview(file);
            } else if (type === 'video') {
                displayVideoPreview(file);
            }
        }
    };

    if (type === 'image') {
        fileInput.accept = 'image/*';
    } else if (type === 'video') {
        fileInput.accept = 'video/*';
    }

    fileInput.click();
}

function displayImagePreview(file) {
    var previewImage = document.getElementById('previewImage');
    previewImage.src = URL.createObjectURL(file);
    previewImage.style.display = 'block';
    document.getElementById('previewVideo').style.display = 'none';
}

function displayVideoPreview(file) {
    var previewVideo = document.getElementById('previewVideo');
    previewVideo.src = URL.createObjectURL(file);
    previewVideo.style.display = 'block';
    document.getElementById('previewImage').style.display = 'none';
}

// Add Text In Card
function updateLokiBox(lokiBoxId, inputField) {
    document.getElementById(lokiBoxId).innerText = inputField.value;
}

// Add Card Number 16 digit
function maskNumber() {
    let inputNumber = document.getElementById('cardNumber').value;

    let digitsOnly = inputNumber.replace(/\D/g, '');

    let maskedPart = digitsOnly.substring(0, 12).replace(/./g, '*');

    let lastPart = digitsOnly.substring(12);

    let maskedNumber = maskedPart.replace(/(.{4})/g, '$1 ').trim() + ' ' + lastPart;

    document.getElementById('lokiCardNumber').textContent = maskedNumber;
}

// Add CVV Number Only Three
function validateInputcvv(inputField) {
    inputField.value = inputField.value.replace(/\D/g, '');

    if (inputField.value.length > 3) {
        inputField.value = inputField.value.slice(0, 3);
    }
    document.getElementById('lokiCVV').textContent = inputField.value;
}

// Faq Section
$('.nested-accordion').find('.comment').slideUp();
$('.nested-accordion').find('p').click(function () {
    $(this).next('.comment').slideToggle(100);
    $(this).toggleClass('selected');
});


// coupen close btn
function toggleButton() {
    var inputField = document.getElementById('inputField');
    var actionButton = document.getElementById('actionButton');

    if (inputField.value.trim() === '') {
        actionButton.innerHTML = '<i class="fas fa-plus"></i>';
    } else {
        actionButton.innerHTML = '<i class="fas fa-times"></i>';
    }
}

function performAction() {
    var inputField = document.getElementById('inputField');
    var actionButton = document.getElementById('actionButton');

    if (inputField.value.trim() === '') {
        window.location.href = 'offers_benefits.html';
    } else {
        inputField.value = '';
        actionButton.innerHTML = '<i class="fas fa-plus"></i>';
    }
}

// Add amount in my wallet
document.addEventListener("DOMContentLoaded", function () {
    function showNotification(message) {
        var notification = document.getElementById("notification");
        if (notification) {
            notification.innerText = message;
            notification.style.display = "block";
            setTimeout(function () {
                notification.style.display = "none";
            }, 5000);
        }
    }

    var addAmountButton = document.getElementById("addAmountButton");
    if (addAmountButton) {
        addAmountButton.addEventListener("click", function () {
            var amountInput = document.getElementById("amount");
            var amount = parseFloat(amountInput.value);

            var walletAmountElement = document.getElementById("wallet-amount");

            if (!isNaN(amount) && walletAmountElement) {
                var currentAmount = parseFloat(walletAmountElement.innerText);
                var newAmount = currentAmount + amount;
                walletAmountElement.innerText = newAmount.toFixed(2);
                amountInput.value = "";
                showNotification("Amount added successfully!");
            } else {
                alert("Please enter a valid number.");
            }
        });
    } else { }

});


// Pay Tip Section
document.addEventListener('DOMContentLoaded', function () {
    const payNowBtn = document.getElementById('payNowBtn');
    const popup = document.getElementById('popup');
    const overlay = document.getElementById('overlay');

    if (payNowBtn) {
        payNowBtn.addEventListener('click', function () {
            overlay.style.display = 'block';
            popup.style.display = 'block';
        });
    }

    if (popup) {
        popup.addEventListener('click', function (event) {
            if (event.target.classList.contains('payment-method')) {
                popup.style.display = 'none';
                document.getElementById('loader').style.display = 'block';
                setTimeout(function () {
                    window.location.href = 'Home_Screen1.html';
                }, 3000);
            }
        });
    }

    if (overlay) {
        overlay.addEventListener('click', function (event) {
            if (event.target === overlay) {
                closePopup();
            }
        });
    }

    function closePopup() {
        overlay.style.display = 'none';
        popup.style.display = 'none';
    }
});