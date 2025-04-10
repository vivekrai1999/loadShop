const SGshopDetails = () => {
    let shopName, userTheme, userThemeVersion, isAppPresent, currentScript, eviShowOrNo, eviTag;
    let abortController;

    let shopDetailsObject = {
        loadStoreData: () => {
            if (typeof Shopify !== "undefined" && typeof Shopify.theme === "object") {
                shopName = Shopify.shop;
                userTheme = Shopify.theme.schema_name;
                userThemeVersion = Shopify.theme.schema_version;
                isAppPresent = typeof window.spice_allImages == "undefined" ? false : true;
                eviShowOrNo = typeof window.spice_allTags !== "undefined" && spice_allTags?.includes("evi_showorno") ? true : false;
                currentScript = self.getCurrentScript();
                eviTag = self.checkTagSetting();
                console.log(`%cShop Name- ${shopName}\nUser Theme- ${userTheme} V(${userThemeVersion})\nTheme Script- ${currentScript}\nApp Enabled- ${isAppPresent}`, "background-color: #fff; color: green; font-size: 16px; padding: 10px;");
                self.setJquery();
            } else {
                console.log("NOT A SHOPIFY STORE");
            }
        },

        setJquery: () => {
            if (typeof jQuery === "undefined" || typeof jQuery === "object") {
                var scriptTag = document.createElement("script");
                scriptTag.type = "text/javascript";
                scriptTag.src = "https://cdn.jsdelivr.net/combine/npm/jquery@3.5.0/dist/jquery.min.js";
                document.head.appendChild(scriptTag);
            } else {
                $ = jQuery;
            }
            window.innerWidth > 1200 && self.setUI();
        },

        getAllProducts: async (signal) => {
            let allProducts = [];
            let limit = 250;
            let page = 1;
            let fetchedproducts = 0;

            try {
                while (true) {
                    if (signal.aborted) return [];
                    const response = await fetch(`/products.json?limit=${limit}&page=${page}`, { signal });
                    const data = await response.json();
                    const products = data?.products || [];

                    $(".sgPageCount").html(`Page Fetched: ${page}`);
                    $(".sgProductCount").html(`Products Fetched: ${fetchedproducts}`);

                    allProducts = [...allProducts, ...products];

                    fetchedproducts += products.length;

                    if (products.length < limit) {
                        $(".sgProductCount").html(`Products Fetched: ${fetchedproducts}`);
                        break;
                    }

                    page++;
                }
                return allProducts;
            } catch (error) {
                if (error.name === "AbortError") {
                    console.warn(`Fetch aborted`);
                } else {
                    console.error("Error fetching product :", error);
                }
                return [];
            }
        },

        getEviVariables: async (signal) => {
            try {
                let allProducts = await self.getAllProducts(signal);
                const productsWithVariants = allProducts.filter(({ variants, images }) => variants.length > 1 && images.some(({ variant_ids }) => variant_ids.length !== 0));
                const productsWithColorOption = productsWithVariants.filter(({ options }) => options.some(({ name }) => name.toLowerCase() === "color" || name.toLowerCase() === "colour"));
                const productsWithCommonImages = productsWithVariants.filter(({ images }) => images?.length > 1 && images[0]?.variant_ids?.length === 0);
                return { productsWithVariants, productsWithColorOption, productsWithCommonImages };
            } catch (error) {
                console.error("Error fetching EVI variables:", error);
                return {};
            }
        },

        getProductsWithVideo: async (signal) => {
            try {
                const { productsWithVariants } = await self.getEviVariables(signal);
                if (signal.aborted) return [];
                const productWithVideos = await Promise.all(productsWithVariants.map((product) => self.checkVideoProduct(product, signal)));
                const filteredVideos = productWithVideos.filter((product) => product !== null);
                return filteredVideos;
            } catch (error) {
                console.error("Error fetching products with video", error);
                throw error;
            }
        },

        checkVideoProduct: async (product, signal) => {
            try {
                if (signal.aborted) return null;
                const response = await fetch(`/products/${product.handle}.js`, { signal });
                const data = await response.json();
                if (data?.media?.some(({ media_type }) => media_type === "video")) {
                    return product;
                }
                return null;
            } catch (error) {
                if (error.name === "AbortError") {
                    console.warn(`Fetch aborted`);
                } else {
                    console.error("Error fetching product template:", error);
                }
                return null;
            }
        },

        getProductsWithTemplate: async (signal) => {
            try {
                const { productsWithVariants } = await self.getEviVariables(signal);
                if (signal.aborted) return [];
                const productWithTemplate = await Promise.all(productsWithVariants.map((product) => self.checkTemplateProduct(product, signal)));
                const filteredTemplate = productWithTemplate.filter((product) => product !== null);
                return filteredTemplate;
            } catch (error) {
                console.error("Error fetching products with template", error);
                throw error;
            }
        },

        checkTemplateProduct: async (product, signal) => {
            try {
                if (signal.aborted) return null;
                const response = await fetch(`/products/${product.handle}.json`, { signal });
                const data = await response.json();
                if (data?.product?.template_suffix !== null && data?.product?.template_suffix.trim() !== "") {
                    return product;
                }
                return null;
            } catch (error) {
                if (error.name === "AbortError") {
                    console.warn(`Fetch aborted `);
                } else {
                    console.error("Error fetching product template:", error);
                }
                return null;
            }
        },

        setUI: async () => {
            if (typeof jQuery === "undefined") {
                setTimeout(() => {
                    self.setUI();
                }, 15);
                return false;
            }

            const styles = `<style>
                .store-data--extension_button-spicegems {
                    height: 45px;
                    width: 50px;
                    background-color: #444;
                    position: fixed;
                    z-index: 99999999;
                    border-radius: 10px 0px 0px 10px;  
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
                    right: -15px;
                    top: 50%;
                    display: flex;
                    transition: all linear 0.2s;           
                }

                .store-data--extension_button-spicegems:hover {
                    right: 0px;
                }

                .expand-button-icon--spicegems {
                    width: 15px;
                    background-color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .main-button-icon--spicegems {
                    width: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            
                .main-extension-spicegems {
                    font-family: system-ui;
                    min-width: 150px;
                    width: 50%;
                    max-width: 460px;
                    background-color: #000;
                    position: fixed;
                    z-index: 99999999;
                    right: 10px;
                    top: 50px;
                    border-radius: 10px;
                    padding: 25px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
                    opacity: 0.8;
                    font-size: 14px;
                    cursor: grab;
                }

                .main-extension-spicegems .tab-content-spicegems table, .main-extension-spicegems .tab-content-spicegems tr, .main-extension-spicegems .tab-content-spicegems td {
                    margin: 0;
                    padding: 0;
                    border: none;
                }

                .main-extension-spicegems .tab-content-spicegems td {
                    padding: 10px 0px;
                    color: #ffffff;
                    font-size: 14px;
                }

                .main-extension-spicegems .tab-content-spicegems td:not(.evi-details_spicegems) {
                    width: 30%;
                }

                .main-extension-spicegems p{
                    margin:0;
                    padding:0;
                    width: fit-content;
                }

                .main-extension--container-spicegems {  
                    height: 100%;  
                    display: grid;
                    grid-auto-rows: 40px 30px 1fr;
                }

                .extension-close--spicegems img {
                    transition: all linear 0.2s;
                    cursor: pointer;
                }

                .extension-close--spicegems img:hover {
                    transform: rotate(90deg)
                }

                .extension-heading-spicegems {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }
            
                .extension-heading-spicegems h1 {
                    all: unset;
                    font-size: 15px !important;
                    color: #fff;
                    text-transform: uppercase;
                    font-weight: 500;
                    letter-spacing: 4px;
                    word-spacing: 7px;
                }
            
                .tab-spicegems .tab-heading-spicegems {
                    font-size: 11px !important;
                    color: #fff;
                    text-transform: uppercase;
                    font-weight: 500;
                }
            
                .tab-navigation-spicegems {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    margin-bottom: 10px;
                }
            
                .tab-spicegems {
                    cursor: pointer;
                    color: #fff;
                    position: relative;
                    
                }

                .tab-spicegems.products-spicegems {
                    display: flex;
                    justify-content: center;
                }

                .tab-spicegems.loadScript-spicegems {
                    display: flex;
                    justify-content: end;
                }
            
                .tab-spicegems p {
                    text-transform: uppercase;
                    color: #fff;
                    letter-spacing: 2px;
                    font-weight: 500;
                }
            
                .tab-spicegems.active-spicegems p{
                    border-bottom: 2px solid #fff;
                    padding-bottom: 5px;
                }

                .details-spicegems {text-align: left}
                .loadScript-spicegems {text-align: right}
                .products-spicegems {text-align: center}
            
                .tab-content-spicegems {
                    padding-top: 10px;
                    height: 100%;
                    color: #fff;
                }
            
                .hidden-spicegems {
                    display: none !important;
                }
            
                .shop-info--spicegems {
                    display: flex;
                    flex-direction: row;
                    gap:20px;
                    color: #fff;
                }
            
                .tab-content-spicegems p {
                    font-size: 14px !important;
                    color: #fff;
                }
            
                .tab-content-spicegems p.label-spicegems {
                    text-transform: lowercase;
                    font-size: 14px !important;
                    color: #fff;
                }
                    
                .links-spicegems {
                    display: flex;
                    flex-direction: row;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .shoploadHide {
                    display: none !important;
                }
            
                .product-links--variant_spicegems, .product-links--color_spicegems, .product-links--commonImage_spicegems, .product-links--template_spicegems, .product-links--video_spicegems {
                    padding-bottom: 20px;
                    height: 200px;
                    overflow-y: auto;
                }

                .product-links--variant_spicegems, .product-links--color_spicegems, .product-links--commonImage_spicegems, .product-links--template_spicegems, .product-links--video_spicegems {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
            
                .product-links--variant_spicegems a, .product-links--color_spicegems a, .product-links--commonImage_spicegems a, .product-links--template_spicegems a, .product-links--video_spicegems a {
                    font-size: 14px !important;
                    color: #ffffff;
                    transition: all linear 0.2s;
                    background-color: #007bff;
                    padding: 2px 10px;
                    border-radius: 50px;
                    text-decoration: none !important;
                }
            
                .product-links--variant_spicegems a:hover, .product-links--color_spicegems a:hover, .product-links--commonImage_spicegems a:hover, .product-links--template_spicegems a:hover, product-links--video_spicegems a:hover {
                    color: #ffffff;
                    background-color: #0056b3;
                }

                .evi-details_spicegems {
                    font-size: 14px !important;
                    color: #fff;
                    cursor: pointer; 
                    display: flex;
                    flex-direction: row;
                    gap: 5px;
                }
            
                .evi-details_spicegems span {
                    background-color: #1e90ff;
                    padding-left: 5px;
                    padding-right: 5px;
                    font-size: 14px !important;
                }

                .file-picker-container--spicegems{
                    display: flex;
                    width: 100%;
                    justify-content: space-between;

                }

                .file-picker-container--spicegems input[type="file"] {
                    color: unset;
                    margin: unset;
                    padding: unset;
                    height: unset;
                    line-height: unset;
                    background-color: unset;
                    border: unset;
                  }

                .file-picker-container--spicegems input[type="file"] {
                  position: relative;
                }

                .file-picker-container--spicegems input[type="file"]::file-selector-button {
                  width: 136px;
                  color: transparent;
                }

                .file-picker-container--spicegems input[type="file"]::before {
                  position: absolute;
                  pointer-events: none;
                  top: 10px;
                  left: 16px;
                  height: 20px;
                  width: 20px;
                  content: "";
                  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230964B0'%3E%3Cpath d='M18 15v3H6v-3H4v3c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-3h-2zM7 9l1.41 1.41L11 7.83V16h2V7.83l2.59 2.58L17 9l-5-5-5 5z'/%3E%3C/svg%3E");
                }

                .file-picker-container--spicegems input[type="file"]::after {
                  position: absolute;
                  pointer-events: none;
                  top: 11px;
                  left: 40px;
                  color: #0964b0;
                  content: "Upload File";
                }

                .file-picker-container--spicegems input[type="file"]::file-selector-button {
                  border-radius: 4px;
                  padding: 0 16px;
                  height: 40px;
                  cursor: pointer;
                  background-color: white;
                  border: 1px solid rgba(0, 0, 0, 0.16);
                  box-shadow: 0px 1px 0px rgba(0, 0, 0, 0.05);
                  margin-right: 16px;
                  transition: background-color 200ms;
                }

                .file-picker-container--spicegems input[type="file"]::file-selector-button:hover {
                  background-color: #f3f4f6;
                }

                .file-picker-container--spicegems input[type="file"]::file-selector-button:active {
                  background-color: #e5e7eb;
                }</style>`;

            const uiHtml = `
                <div class="store-data--extension-spicegems">
                <div class="store-data--extension_button-spicegems">
                    <div class="main-button-icon--spicegems" style="font-size: 24px; color: #fff; cursor: pointer">
                       ⚙
                    </div>
                    <div class="expand-button-icon--spicegems">↖</div>
                </div>
                <div class="main-extension-spicegems hidden-spicegems">
                    <div class="main-extension--container-spicegems">
                        <div class="extension-heading-spicegems">
                            <div class="extension-heading-item-spicegems" style="width:20px; height: 20px opacity:0;">.</div>
                            <div class="extension-heading-item-spicegems"><h1>Shop Details</h1></div>
                            <div class="extension-heading-item-spicegems extension-close--spicegems"><img style="height:20px; width: auto" src="https://img.icons8.com/fluent-systems-regular/512/FFFFFF/delete-sign.png" /></div>
                        </div>
                        <div class="tab-navigation-spicegems">
                                <div class="tab-spicegems details-spicegems active-spicegems"><p class="tab-heading-spicegems">Details</p></div>
                                <div class="tab-spicegems products-spicegems"><p class="tab-heading-spicegems">Products</p></div>
                                <div class="tab-spicegems loadScript-spicegems"><p class="tab-heading-spicegems">LoadScript</p></div>
                            </div>
                        <div class="tab-container-spicegems">
                            <select id="productFilter" class="shoploadHide" style="color: #000; background-color: #ffffff; width: 100%; padding: 10px 5px; border-radius: 5px; margin: 10px 0px; font-size: 12px">
                                <option value="variants" selected>Products with Variants</option>
                                <option value="colors">Products with Color Options</option>
                                <option value="commonImages">Products with Common Images</option>
                                <option value="template">Products with Template</option>
                                <option value="video">Products with Video</option>
                            </select>
                            <div id="loadedProducts" class="shoploadHide" style="display: flex; align-items: center; justify-content: space-between">
                                <span style="color: #ffffff" class="sgPageCount"></span>
                                <span style="color: #ffffff" class="sgProductCount"></span>
                            </div>
                            <div class="tab-content-spicegems"></div>
                        </div>
                    </div>
                </div>
            </div>
            `;

            $("head").append(styles);
            $("body").append(uiHtml);

            $(".store-data--extension_button-spicegems").on("click", (e) => {
                $(".main-extension-spicegems").toggleClass("hidden-spicegems");
                $(".store-data--extension_button-spicegems").addClass("hidden-spicegems");
                $(".tab-spicegems.details-spicegems").trigger("click");
            });

            $(".extension-close--spicegems").on("click", (e) => {
                $(".main-extension-spicegems").addClass("hidden-spicegems");
                $(".store-data--extension_button-spicegems").removeClass("hidden-spicegems");
            });

            $(".tab-spicegems").on("click", async (e) => {
                $(".tab-spicegems").removeClass("active-spicegems");
                $(e.currentTarget).addClass("active-spicegems");

                if (abortController) {
                    abortController.abort();
                    $("#productFilter option").removeAttr("selected");
                    $("#productFilter option").eq(0).attr("selected", "selected");
                }
                abortController = new AbortController();
                const signal = abortController?.signal;

                if ($(e.currentTarget).hasClass("details-spicegems")) {
                    $("#productFilter").addClass("shoploadHide");
                    $("#loadedProducts").addClass("shoploadHide");

                    const details = self.generateDetailsTable();
                    $(".tab-content-spicegems").html(details);

                    $(".evi-details_spicegems p").on("click", (e) => {
                        self.copyToClipboard(e.currentTarget);
                        $(".evi-details_spicegems span").addClass("hidden-spicegems");
                        const success = e.currentTarget.closest(".evi-details_spicegems").querySelector("span");
                        if (success) {
                            $(success).removeClass("hidden-spicegems");
                        }
                    });
                }

                if ($(e.currentTarget).hasClass("products-spicegems")) {
                    $("#productFilter").removeClass("shoploadHide");
                    $("#loadedProducts").removeClass("shoploadHide");
                    $(".sgPageCount, .sgProductCount").html("");

                    $(".tab-content-spicegems").html(self.loadingSpinner());

                    const { productsWithVariants, productsWithColorOption, productsWithCommonImages } = await self.getEviVariables(signal);
                    self.updateProductLinks("variants", productsWithVariants, productsWithColorOption, productsWithCommonImages, signal);

                    $("#productFilter").on("change", (e) => {
                        const selectedFilter = e.target.value;
                        self.updateProductLinks(selectedFilter, productsWithVariants, productsWithColorOption, productsWithCommonImages, signal);
                        $(e.target).find("option").removeAttr("selected");
                        $(e.target).find(`option[value=${selectedFilter}]`).attr("selected", "");
                    });
                }

                if ($(e.currentTarget).hasClass("loadScript-spicegems")) {
                    $("#productFilter").addClass("shoploadHide");
                    $("#loadedProducts").addClass("shoploadHide");

                    $(".tab-content-spicegems").html(self.filePickerHtml());

                    $("#executeFile-spicegems").on("click", () => {
                        const fileInput = document.getElementById("filePicker-spicegems");
                        if (fileInput.files.length > 0) {
                            const file = fileInput.files[0];
                            const reader = new FileReader();
                            reader.onload = function (event) {
                                try {
                                    let fileContent = event.target.result;

                                    console.log(fileContent);

                                    fileContent = fileContent
                                        .replace("<?php echo $host; ?>", "")
                                        .replace("window.location", "''")
                                        .replace("<?php echo $shop_name; ?>", window.Shopify.shop.replace(".myshopify.com", ""))
                                        .replace(
                                            "<?php echo json_encode($settings); ?>",
                                            `{
                                            is_active: "1",
                                            show_on: 0,
                                            theme_id: "410",
                                            evi_fimg_skip: "1",
                                            evi_product_show: "default",
                                            sg_script_run: "1",
                                            w_w_liquid: "1",
                                            user_batches: "1",
                                            sg_solved: "0",
                                            currency: "Rs. {{amount}}",
                                        }`
                                        )
                                        .replace(
                                            "<?php echo json_encode($theme_data); ?>",
                                            `{
                                            t_name: "",
                                            productblock: "",
                                            thumbList: "",
                                            variant_selector: "",
                                            update_fimg: null,
                                            otherImgSelector: null,
                                            type: "1",
                                            scroller: null,
                                            slideDots: null,
                                        }`
                                        );

                                    console.log(fileContent);

                                    // Execute the modified file content
                                    eval(fileContent);
                                } catch (error) {
                                    console.error("Error executing file content:", error);
                                }
                            };
                            reader.readAsText(file);
                        } else {
                            alert("Please select a file to execute.");
                        }
                    });
                }
            });

            $(".tab-spicegems.details-spicegems").trigger("click");
            self.setDraggable();
        },

        updateProductLinks: async (filterType, productsWithVariants, productsWithColorOption, productsWithCommonImages, signal) => {
            if (!$(".products-spicegems").hasClass("active-spicegems")) return;
            let filteredHtml = "";
            if (filterType === "variants") {
                const productWithVariantHtml = productsWithVariants?.map(({ handle }) => `<a target="_blank" href="/products/${handle}">${handle.length > 30 ? handle.slice(0, 20).concat("...") : handle} ↗</a>`).join("");
                filteredHtml = `<div class="product-links--variant_spicegems"><div>Variant Wise Images: ${productsWithVariants?.length}</div><div class="links-spicegems">${productWithVariantHtml}</div></div>`;
                $(".tab-content-spicegems").html(filteredHtml);
            } else if (filterType === "colors") {
                const productWithColorOptionsHtml = productsWithColorOption?.map(({ handle }) => `<a target="_blank" href="/products/${handle}">${handle.length > 30 ? handle.slice(0, 20).concat("...") : handle} ↗</a>`).join("");
                filteredHtml = `<div class="product-links--color_spicegems"><div>Color Options: ${productsWithColorOption?.length}</div><div class="links-spicegems">${productWithColorOptionsHtml}</div></div>`;
                $(".tab-content-spicegems").html(filteredHtml);
            } else if (filterType === "commonImages") {
                const productWithCommonImagesHtml = productsWithCommonImages?.map(({ handle }) => `<a target="_blank" href="/products/${handle}">${handle.length > 30 ? handle.slice(0, 20).concat("...") : handle} ↗</a>`).join("");
                filteredHtml = `<div class="product-links--commonImage_spicegems"><div>Products with common images: ${productsWithCommonImages?.length}</div><div class="links-spicegems">${productWithCommonImagesHtml}</div></div>`;
                $(".tab-content-spicegems").html(filteredHtml);
            } else if (filterType === "template") {
                $(".tab-content-spicegems").html(self.loadingSpinner());
                const productsWithTemplate = await self.getProductsWithTemplate(signal);
                if (!signal.aborted) {
                    const productWithTemplateHtml = productsWithTemplate?.map(({ handle }) => `<a target="_blank" href="/products/${handle}">${handle.length > 30 ? handle.slice(0, 20).concat("...") : handle} ↗</a>`).join("");
                    filteredHtml = `<div class="product-links--template_spicegems"><div>Products with Template: ${productsWithTemplate?.length}</div><div class="links-spicegems">${productWithTemplateHtml}</div></div>`;
                    $(".tab-content-spicegems").html(filteredHtml);
                }
            } else if (filterType === "video") {
                $(".tab-content-spicegems").html(self.loadingSpinner());
                const productWithVideo = await self.getProductsWithVideo(signal);
                if (!signal.aborted) {
                    const productWithVideoHtml = productWithVideo?.map(({ handle }) => `<a target="_blank" href="/products/${handle}">${handle.length > 30 ? handle.slice(0, 20).concat("...") : handle} ↗</a>`).join("");
                    filteredHtml = `<div class="product-links--video_spicegems"><div>Products with video: ${productWithVideo?.length}</div><div class="links-spicegems">${productWithVideoHtml}</div></div>`;
                    $(".tab-content-spicegems").html(filteredHtml);
                }
            }
        },

        generateDetailsTable: () => {
            return `<table style="width: 100%">
                <tr><td>Name</td><td class="evi-details_spicegems"><p>${shopName}</p><span class="hidden-spicegems">#copied</span></td></tr>
                <tr><td>Theme</td><td class="evi-details_spicegems"><p>${userTheme} V(${userThemeVersion})</p><span class="hidden-spicegems">#copied</span></td></tr>
                <tr><td>Script</td><td class="evi-details_spicegems"><p>${currentScript}</p><span class="hidden-spicegems">#copied</span></td></tr>
                <tr><td>App Enabled</td><td class="evi-details_spicegems"><p>${isAppPresent ? "On" : "Off"}</p><span class="hidden-spicegems">#copied</span></td></tr>
                ${
                    isAppPresent
                        ? `<tr><td>EVI tag</td><td class="evi-details_spicegems"><p>${eviTag || "Not Available"}</p><span class="hidden-spicegems">#copied</span></td></tr>
                <tr><td>evi_tagshoworno</td><td class="evi-details_spicegems"><p>${eviShowOrNo ? "Available" : "Not Available"}</p><span class="hidden-spicegems">#copied</span></td></tr>`
                        : ""
                }
            </table>`;
        },

        filePickerHtml: () => {
            return `<div class="file-picker-container--spicegems">
                        <input type="file" id="filePicker-spicegems" />
                        <button id="executeFile-spicegems" style="padding: 5px 10px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Execute</button>
                    </div>`;
        },

        loadingSpinner: () => {
            return `<div style="width: 100%; display: flex; align-items: center; justify-content: center;">
                        <img src="https://media.tenor.com/On7kvXhzml4AAAAj/loading-gif.gif" style="width: 30px; height: 30px;"/>
                    </div>`;
        },

        getCurrentScript: () => {
            if (window.SPICEVIAScript) {
                const themeName = SPICEVIA.SGvarintsImage.toString()
                    ?.split("t_name")[1]
                    ?.split("productblock")[0]
                    ?.match(/:\s*"([^"]+)"/);

                return themeName ? themeName[1] : "Theme name not found";
            } else {
                return "EVI script not available";
            }
        },

        checkTagSetting: () => {
            if (window.SPICEVIAScript) {
                const tag = SPICEVIA.SGvarintsImage.toString()
                    ?.split("evi_product_show")[1]
                    ?.match(/:\s*"([^"]+)"/)[1];
                return tag;
            }
        },

        copyToClipboard: (element) => {
            var $temp = $("<input>");
            $("body").append($temp);
            $temp.val($(element).text()).select();
            document.execCommand("copy");
            $temp.remove();
        },

        setDraggable: () => {
            var object = document.querySelector(".main-extension-spicegems"),
                initX,
                initY,
                firstX,
                firstY;

            object.addEventListener(
                "mousedown",
                function (e) {
                    if (e.target.tagName !== "SELECT") {
                        e.preventDefault();
                    }
                    initX = this.offsetLeft;
                    initY = this.offsetTop;
                    firstX = e.pageX;
                    firstY = e.pageY;

                    this.addEventListener("mousemove", dragIt, false);

                    window.addEventListener(
                        "mouseup",
                        function () {
                            object.removeEventListener("mousemove", dragIt, false);
                        },
                        false
                    );
                },
                false
            );

            object.addEventListener(
                "touchstart",
                function (e) {
                    e.preventDefault();
                    initX = this.offsetLeft;
                    initY = this.offsetTop;
                    var touch = e.touches;
                    firstX = touch[0].pageX;
                    firstY = touch[0].pageY;

                    this.addEventListener("touchmove", swipeIt, false);

                    window.addEventListener(
                        "touchend",
                        function (e) {
                            e.preventDefault();
                            object.removeEventListener("touchmove", swipeIt, false);
                        },
                        false
                    );
                },
                false
            );

            function dragIt(e) {
                this.style.left = initX + e.pageX - firstX + "px";
                this.style.top = initY + e.pageY - firstY + "px";
            }

            function swipeIt(e) {
                var contact = e.touches;
                this.style.left = initX + contact[0].pageX - firstX + "px";
                this.style.top = initY + contact[0].pageY - firstY + "px";
            }
        },
    };

    let self = shopDetailsObject;
    self.loadStoreData();
};

(function () {
    if (document.readyState === "complete" || (document.readyState !== "loading" && !document.documentElement.doScroll)) {
        setTimeout(() => {
            SGshopDetails();
        }, 300);
    } else {
        document.addEventListener("DOMContentLoaded", () => {
            setTimeout(() => {
                SGshopDetails();
            }, 300);
        });
    }
})();
