import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Gem,
  Heart,
  ImageUp,
  LockKeyhole,
  LogOut,
  MessageCircle,
  Plus,
  Save,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  X
} from "lucide-react";
import "./styles.css";
import Statistics from "./Statistics";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
const cloudinaryUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

const emptyProduct = {
  slug: "",
  name: "",
  brand: "",
  category: "",
  price: "",
  rating: 4.5,
  image: "",
  affiliateUrl: "",
  description: "",
  isFeatured: false
};

const emptyLookItem = {
  name: "",
  category: "",
  image: "",
  affiliateUrl: ""
};

const emptyLook = {
  title: "",
  subtitle: "",
  image: "",
  description: "",
  weekLabel: "Look de la semaine",
  isActive: false,
  items: [{ ...emptyLookItem }]
};

function buildSlug(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function App() {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [looks, setLooks] = useState([]);
  const [activeLook, setActiveLook] = useState(null);
  const [selectedLook, setSelectedLook] = useState(null);
  const [looksLoading, setLooksLoading] = useState(true);
  const [looksError, setLooksError] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [search, setSearch] = useState("");
  const [view, setView] = useState(() => window.location.hash === "#admin" ? "admin" : window.location.hash === "#looks" ? "looks" : "shop");
  const [adminTab, setAdminTab] = useState("products");
  const [form, setForm] = useState(emptyProduct);
  const [lookForm, setLookForm] = useState(emptyLook);
  const [editingId, setEditingId] = useState(null);
  const [editingLookId, setEditingLookId] = useState(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [lookMessage, setLookMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem("velioraAdminToken") || "");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginMessage, setLoginMessage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadMessage, setImageUploadMessage] = useState("");
  const [isUploadingLookImage, setIsUploadingLookImage] = useState(false);
  const [lookImageUploadMessage, setLookImageUploadMessage] = useState("");
  const [uploadingLookItemIndex, setUploadingLookItemIndex] = useState(null);
  const [lookItemImageUploadMessage, setLookItemImageUploadMessage] = useState("");

  async function loadProducts() {
    setProductsLoading(true);
    setProductsError("");
    try {
      const response = await fetch(`${apiUrl}/products`, { signal: AbortSignal.timeout(90000) });

      if (!response.ok) {
        throw new Error("API indisponible");
      }

      const apiProducts = await response.json();

      if (!Array.isArray(apiProducts)) throw new Error("Reponse invalide");
      setProducts(apiProducts);
    } catch {
      setProductsError("Impossible de charger les produits pour le moment.");
    } finally {
      setProductsLoading(false);
    }
  }

  async function loadLooks() {
    setLooksLoading(true);
    setLooksError("");
    try {
      const [looksResponse, activeResponse] = await Promise.all([
        fetch(`${apiUrl}/looks`, { signal: AbortSignal.timeout(90000) }),
        fetch(`${apiUrl}/looks/active`, { signal: AbortSignal.timeout(90000) })
      ]);

      if (!looksResponse.ok) {
        throw new Error("Looks indisponibles");
      }

      const apiLooks = await looksResponse.json();
      if (!Array.isArray(apiLooks)) throw new Error("Reponse invalide");
      if (!activeResponse.ok && activeResponse.status !== 404) throw new Error("Look actif indisponible");
      const apiActiveLook = activeResponse.ok ? await activeResponse.json() : null;
      setLooks(apiLooks);
      setActiveLook(apiActiveLook || null);
      setSelectedLook((current) => apiLooks.find((look) => look._id === current?._id) || apiActiveLook || apiLooks[0] || null);
    } catch {
      setLooksError("Impossible de charger les looks pour le moment.");
    } finally {
      setLooksLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    loadLooks();
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD || adminToken || window.location.hash === "#admin" || !["shop", "looks"].includes(view)) return;
    if (["localhost", "127.0.0.1"].includes(window.location.hostname)) return;
    fetch(`${apiUrl}/statistics/view`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: view }), keepalive: true
    }).catch(() => {});
  }, [view, adminToken]);

  useEffect(() => {
    function syncViewFromHash() {
      if (window.location.hash === "#admin") {
        setView("admin");
      } else if (window.location.hash === "#looks") {
        setView("looks");
      }
    }

    syncViewFromHash();
    window.addEventListener("hashchange", syncViewFromHash);
    return () => window.removeEventListener("hashchange", syncViewFromHash);
  }, []);

  const categories = useMemo(() => ["Tous", ...new Set(products.map((item) => item.category))], [products]);

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "Tous" || product.category === selectedCategory;
    const matchesSearch = `${product.name} ${product.brand} ${product.category}`
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const displayedLooks = looks;

  function getProductHref(product) {
    if (adminToken) return product.affiliateUrl || "#";
    if (product._id) {
      return `${apiUrl}/products/${product.slug}/redirect`;
    }

    return product.affiliateUrl || "#";
  }

  function goToShopSection(sectionId) {
    setView("shop");
    window.history.replaceState(null, "", `#${sectionId}`);
    window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  function adminHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    };
  }

  function handleAdminResponse(response, data) {
    if (response.status === 401) {
      localStorage.removeItem("velioraAdminToken");
      setAdminToken("");
      throw new Error("Votre session a expire. Connectez-vous a nouveau.");
    }

    if (!response.ok) {
      throw new Error(data?.message || "Operation administrateur impossible.");
    }
  }

  async function loginAdmin(event) {
    event.preventDefault();
    setLoginMessage("");

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.token) {
        throw new Error(data?.message || "Connexion impossible.");
      }

      localStorage.setItem("velioraAdminToken", data.token);
      setAdminToken(data.token);
      setLoginForm({ email: "", password: "" });
    } catch (error) {
      setLoginMessage(error.message);
    }
  }

  function logoutAdmin() {
    localStorage.removeItem("velioraAdminToken");
    setAdminToken("");
    setView("shop");
    window.history.replaceState(null, "", "#top");
  }

  function replaceLook(updatedLook) {
    setLooks((current) => current.map((look) => (look._id === updatedLook._id ? updatedLook : look)));
    setSelectedLook(updatedLook);

    if (updatedLook.isActive) {
      setActiveLook(updatedLook);
    }
  }

  async function openLook(look) {
    setSelectedLook(look);

    if (adminToken || !look._id) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/looks/${look._id}/view`, { method: "POST" });

      if (response.ok) {
        replaceLook(await response.json());
      }
    } catch {
      setSelectedLook(look);
    }
  }

  async function likeLook(look) {
    if (!look._id) {
      setSelectedLook((current) => ({ ...current, likes: (current.likes || 0) + 1 }));
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/looks/${look._id}/like`, { method: "POST" });

      if (response.ok) {
        replaceLook(await response.json());
      }
    } catch {
      setSelectedLook(look);
    }
  }

  async function addComment(event) {
    event.preventDefault();
    const message = commentDraft.trim();

    if (!message) {
      return;
    }

    if (!selectedLook) return;
    if (!selectedLook._id) {
      setSelectedLook((current) => ({
        ...current,
        comments: [...(current.comments || []), { author: "Invite", message }]
      }));
      setCommentDraft("");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/looks/${selectedLook._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: "Invite", message })
      });

      if (response.ok) {
        replaceLook(await response.json());
        setCommentDraft("");
      }
    } catch {
      setCommentDraft(message);
    }
  }

  function updateForm(field, value) {
    setForm((current) => {
      const nextForm = { ...current, [field]: value };

      if (field === "name" && !editingId) {
        nextForm.slug = buildSlug(value);
      }

      return nextForm;
    });
  }

  function updateLookForm(field, value) {
    setLookForm((current) => ({ ...current, [field]: value }));
  }

  function updateLookItem(index, field, value) {
    setLookForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    }));
  }

  function addLookItem() {
    setLookForm((current) => ({ ...current, items: [...current.items, { ...emptyLookItem }] }));
  }

  function removeLookItem(index) {
    setLookForm((current) => ({
      ...current,
      items: current.items.length === 1 ? current.items : current.items.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function resetForm() {
    setForm(emptyProduct);
    setEditingId(null);
    setAdminMessage("");
    setImageUploadMessage("");
  }

  function resetLookForm() {
    setLookForm(emptyLook);
    setEditingLookId(null);
    setLookMessage("");
    setLookImageUploadMessage("");
    setLookItemImageUploadMessage("");
  }

  function editProduct(product) {
    setEditingId(product._id);
    setForm({
      slug: product.slug || "",
      name: product.name || "",
      brand: product.brand || "",
      category: product.category || "",
      price: product.price || "",
      rating: product.rating || 4.5,
      image: product.image || "",
      affiliateUrl: product.affiliateUrl || "",
      description: product.description || "",
      isFeatured: Boolean(product.isFeatured)
    });
    setAdminMessage("");
    setAdminTab("products");
    setView("admin");
  }

  function editLook(look) {
    setEditingLookId(look._id);
    setLookForm({
      title: look.title || "",
      subtitle: look.subtitle || "",
      image: look.image || "",
      description: look.description || "",
      weekLabel: look.weekLabel || "Look de la semaine",
      isActive: Boolean(look.isActive),
      items: look.items?.length ? look.items : [{ ...emptyLookItem }]
    });
    setLookMessage("");
    setLookImageUploadMessage("");
    setLookItemImageUploadMessage("");
    setAdminTab("looks");
    setView("admin");
  }

  async function saveProduct(event) {
    event.preventDefault();
    setIsSaving(true);
    setAdminMessage("");

    try {
      const endpoint = editingId ? `${apiUrl}/products/${editingId}` : `${apiUrl}/products`;
      const method = editingId ? "PUT" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: adminHeaders(),
        body: JSON.stringify(form)
      });
      const data = response.status === 204 ? null : await response.json().catch(() => null);

      handleAdminResponse(response, data);

      setAdminMessage(editingId ? "Produit modifie avec succes." : "Produit ajoute avec succes.");
      resetForm();
      await loadProducts();
    } catch (error) {
      setAdminMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadProductImage(file) {
    if (!file) {
      return;
    }

    if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
      setImageUploadMessage("Cloudinary n'est pas encore configure sur Netlify.");
      return;
    }

    setIsUploadingImage(true);
    setImageUploadMessage("Upload de l'image en cours...");

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("upload_preset", cloudinaryUploadPreset);
      uploadData.append("folder", "maison-veliora/products");

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`, {
        method: "POST",
        body: uploadData
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.secure_url) {
        throw new Error(data?.error?.message || "Upload Cloudinary impossible.");
      }

      updateForm("image", data.secure_url);
      setImageUploadMessage("Image envoyee. L'URL a ete ajoutee au produit.");
    } catch (error) {
      setImageUploadMessage(error.message);
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function uploadLookImage(file) {
    if (!file) {
      return;
    }

    if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
      setLookImageUploadMessage("Cloudinary n'est pas encore configure sur Netlify.");
      return;
    }

    setIsUploadingLookImage(true);
    setLookImageUploadMessage("Upload de l'image du look en cours...");

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("upload_preset", cloudinaryUploadPreset);
      uploadData.append("folder", "maison-veliora/looks");

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`, {
        method: "POST",
        body: uploadData
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.secure_url) {
        throw new Error(data?.error?.message || "Upload Cloudinary impossible.");
      }

      updateLookForm("image", data.secure_url);
      setLookImageUploadMessage("Image envoyee. L'URL a ete ajoutee au look.");
    } catch (error) {
      setLookImageUploadMessage(error.message);
    } finally {
      setIsUploadingLookImage(false);
    }
  }

  async function uploadLookItemImage(index, file) {
    if (!file) {
      return;
    }

    if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
      setLookItemImageUploadMessage("Cloudinary n'est pas encore configure sur Netlify.");
      return;
    }

    setUploadingLookItemIndex(index);
    setLookItemImageUploadMessage(`Upload de l'image de la piece ${index + 1} en cours...`);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("upload_preset", cloudinaryUploadPreset);
      uploadData.append("folder", "maison-veliora/look-items");

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`, {
        method: "POST",
        body: uploadData
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.secure_url) {
        throw new Error(data?.error?.message || "Upload Cloudinary impossible.");
      }

      updateLookItem(index, "image", data.secure_url);
      setLookItemImageUploadMessage("Image envoyee. L'URL a ete ajoutee a la piece.");
    } catch (error) {
      setLookItemImageUploadMessage(error.message);
    } finally {
      setUploadingLookItemIndex(null);
    }
  }

  async function saveLook(event) {
    event.preventDefault();
    setIsSaving(true);
    setLookMessage("");

    try {
      const endpoint = editingLookId ? `${apiUrl}/looks/${editingLookId}` : `${apiUrl}/looks`;
      const method = editingLookId ? "PUT" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: adminHeaders(),
        body: JSON.stringify(lookForm)
      });
      const data = response.status === 204 ? null : await response.json().catch(() => null);

      handleAdminResponse(response, data);

      setLookMessage(editingLookId ? "Look modifie avec succes." : "Look ajoute avec succes.");
      resetLookForm();
      await loadLooks();
    } catch (error) {
      setLookMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteProduct(product) {
    const confirmed = window.confirm(`Supprimer "${product.name}" ?`);

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/products/${product._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      handleAdminResponse(response);

      setAdminMessage("Produit supprime.");
      await loadProducts();
    } catch (error) {
      setAdminMessage(error.message);
    }
  }

  async function deleteLook(look) {
    const confirmed = window.confirm(`Supprimer "${look.title}" ?`);

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/looks/${look._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      handleAdminResponse(response);

      setLookMessage("Look supprime.");
      await loadLooks();
    } catch (error) {
      setLookMessage(error.message);
    }
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Maison Veliora">
          <span className="brand-mark">V</span>
          <span>Maison Veliora</span>
        </a>
        <nav aria-label="Navigation principale">
          <button className={view === "shop" ? "nav-active" : ""} onClick={() => goToShopSection("top")}>Boutique</button>
          <button className={view === "looks" ? "nav-active" : ""} onClick={() => setView("looks")}>Idées de look</button>
          <button onClick={() => goToShopSection("selection")}>Selection</button>
          <button onClick={() => goToShopSection("look-semaine")}>Look</button>
          <button className={view === "admin" ? "nav-active" : ""} onClick={() => { setView("admin"); window.history.replaceState(null, "", "#admin"); }}>Admin</button>
        </nav>
      </header>

      {view === "shop" && (
        <>
          <section className="hero" id="top">
            <div className="hero-media" aria-hidden="true">
              <img
                src="/images/banniere.png"
                alt=""
                fetchPriority="high"
              />
            </div>
            <div className="hero-content">
              <p className="eyebrow">Edition premium</p>
              <h1>Maison Veliora</h1>
              <p>
                Une experience shopping élégante pour recommander vêtements, accessoires,
                objets lifestyle et idées de look avec des liens partenaires verifies.
              </p>
              <a className="primary-link" href="#selection">
                Explorer la selection <ArrowUpRight size={18} />
              </a>
            </div>
          </section>

          <section className="trust-band" aria-label="Garanties">
            <span><BadgeCheck size={18} /> Produits selectionnes</span>
            <span><Gem size={18} /> Positionnement premium</span>
            <span><Sparkles size={18} /> Looks IA renouvelables</span>
          </section>

          <section className="shop-layout" id="selection">
            <aside className="filters" id="categories">
              <div className="section-heading">
                <p className="eyebrow">Catalogue</p>
                <h2>Categories</h2>
              </div>

              <label className="search-field">
                <Search size={18} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher un article"
                />
              </label>

              <div className="category-list" role="list">
                {categories.map((category) => (
                  <button
                    className={category === selectedCategory ? "active" : ""}
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </aside>

            <section className="product-grid" aria-label="Produits">
              <ProductStatus loading={productsLoading} error={productsError} retry={loadProducts}
                empty={filteredProducts.length === 0} />
              {filteredProducts.map((product) => (
                <article className="product-card" key={product.slug}>
                  <a href={getProductHref(product)} target="_blank" rel="noreferrer sponsored">
                    <img src={product.image} alt={product.name} />
                    <span className="category-pill">{product.category}</span>
                    <strong>{product.name}</strong>
                    <span className="brand-name">{product.brand}</span>
                    <span className="card-footer">
                      <span>{product.price}</span>
                      <span><Star size={15} fill="currentColor" /> {product.rating}</span>
                    </span>
                  </a>
                </article>
              ))}
            </section>
          </section>

          {activeLook && <WeeklyLook look={activeLook} />}
        </>
      )}
{/* ----------------------------------------------------------------------------------------------- */}

      {view === "looks" && (
        <section className="lookbook-page">
          <div className="lookbook-hero">
            <div>
              <p className="eyebrow">Galerie inspiration</p>
              <h1>Idées de look</h1>
              <p>
                Des silhouettes générées et composées comme des moodboards premium, avec les pièces à acheter juste en dessous.
              </p>
            </div>
            {displayedLooks.length > 0 && <button className="secondary-action" onClick={() => openLook(displayedLooks[0])}>
              <Sparkles size={18} /> Selection éditoriale
            </button>}
          </div>

          {looksLoading && <p role="status">Chargement des looks...</p>}
          {looksError && <div role="alert"><p>{looksError}</p><button className="secondary-action" onClick={loadLooks}>Réessayer</button></div>}
          {!looksLoading && !looksError && looks.length === 0 && <p>Aucun look disponible pour le moment.</p>}
          {selectedLook && <>
          <div className="look-gallery-layout">
            <section className="featured-look-panel">
              <img src={selectedLook.image} alt={selectedLook.title} />
              <div className="featured-look-content">
                <span>{selectedLook.weekLabel}</span>
                <h2>{selectedLook.title}</h2>
                <p>{selectedLook.description}</p>
                <div className="social-stats">
                  <span><Eye size={17} /> {selectedLook.views || 0}</span>
                  <button onClick={() => likeLook(selectedLook)}><Heart size={17} /> {selectedLook.likes || 0}</button>
                  <span><MessageCircle size={17} /> {selectedLook.comments?.length || 0}</span>
                </div>
              </div>
            </section>

            <aside className="look-comments-panel">
              <div>
                <p className="eyebrow">Conversation</p>
                <h2>Commentaires</h2>
              </div>
              <div className="comments-list">
                {(selectedLook.comments?.length ? selectedLook.comments : [{ author: "Maison Veliora", message: "Dis-nous ce que tu penses de ce look." }]).map((comment, index) => (
                  <article className="comment-bubble" key={`${comment.author}-${index}`}>
                    <strong>{comment.author}</strong>
                    <p>{comment.message}</p>
                  </article>
                ))}
              </div>
              <form className="comment-form" onSubmit={addComment}>
                <input
                  value={commentDraft}
                  aria-label="Votre commentaire"
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Votre commentaire..."
                />
                <button type="submit" aria-label="Envoyer le commentaire">
                  <Send size={18} />
                </button>
              </form>
            </aside>
          </div>

          <div className="look-piece-strip">
            {selectedLook.items?.map((item) => (
              <a
                className="look-piece-card"
                href={item.affiliateUrl || "#"}
                target={item.affiliateUrl ? "_blank" : undefined}
                rel={item.affiliateUrl ? "noreferrer sponsored" : undefined}
                key={`${selectedLook.title}-${item.name}`}
              >
                <img src={item.image} alt={item.name} />
                <span>{item.category}</span>
                <strong>{item.name}</strong>
              </a>
            ))}
          </div>

          </>}
          <div className="lookbook-grid">
            {displayedLooks.map((look) => (
              <article
                className={`look-card ${selectedLook?._id === look._id ? "selected" : ""}`}
                key={look._id || look.title}
              >
                <img src={look.image} alt={look.title} />
                <div className="look-card-content">
                  <span>{look.weekLabel}</span>
                  <h2>{look.title}</h2>
                  <p>{look.subtitle || look.description}</p>
                  <div className="social-stats compact">
                    <span><Eye size={16} /> {look.views || 0}</span>
                    <span><Heart size={16} /> {look.likes || 0}</span>
                    <span><MessageCircle size={16} /> {look.comments?.length || 0}</span>
                  </div>
                  <div className="look-card-items">
                    {look.items?.slice(0, 4).map((item) => (
                      <img src={item.image} alt={item.name} key={`${look.title}-${item.name}`} />
                    ))}
                  </div>
                  <button className="mini-action" onClick={() => openLook(look)}>
                    Voir le look <ArrowUpRight size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {view === "admin" && !adminToken && (
        <AdminLogin
          loginForm={loginForm}
          loginMessage={loginMessage}
          onChange={(field, value) => setLoginForm((current) => ({ ...current, [field]: value }))}
          onSubmit={loginAdmin}
        />
      )}

      {view === "admin" && adminToken && (
        <section className="admin-page">
          <div className="admin-header">
            <div>
              <p className="eyebrow">Back-office</p>
              <h1>{adminTab === "products" ? "Gestion produits" : adminTab === "looks" ? "Gestion looks" : "Statistiques"}</h1>
            </div>
            <div className="admin-actions">
              {adminTab !== "statistics" && <button className="secondary-action" onClick={adminTab === "products" ? resetForm : resetLookForm}>
                <Plus size={18} /> Nouveau
              </button>}
              <button className="logout-action" onClick={logoutAdmin}>
                <LogOut size={18} /> Deconnexion
              </button>
            </div>
          </div>

          <div className="admin-tabs" role="tablist" aria-label="Administration">
            <button className={adminTab === "products" ? "active" : ""} onClick={() => setAdminTab("products")}>
              Produits
            </button>
            <button className={adminTab === "looks" ? "active" : ""} onClick={() => setAdminTab("looks")}>
              Idees de look
            </button>
            <button className={adminTab === "statistics" ? "active" : ""} onClick={() => setAdminTab("statistics")}>
              Statistiques
            </button>
          </div>

          {adminTab === "statistics" ? <Statistics apiUrl={apiUrl} token={adminToken} products={products} looks={looks} /> : adminTab === "products" ? (
            <ProductAdmin
              adminMessage={adminMessage}
              deleteProduct={deleteProduct}
              editProduct={editProduct}
              editingId={editingId}
              form={form}
              imageUploadMessage={imageUploadMessage}
              isSaving={isSaving}
              isUploadingImage={isUploadingImage}
              products={products}
              productsLoading={productsLoading}
              productsError={productsError}
              loadProducts={loadProducts}
              resetForm={resetForm}
              saveProduct={saveProduct}
              uploadProductImage={uploadProductImage}
              updateForm={updateForm}
            />
          ) : (
            <LookAdmin
              addLookItem={addLookItem}
              deleteLook={deleteLook}
              editLook={editLook}
              editingLookId={editingLookId}
              isUploadingLookImage={isUploadingLookImage}
              isSaving={isSaving}
              lookForm={lookForm}
              lookImageUploadMessage={lookImageUploadMessage}
              lookItemImageUploadMessage={lookItemImageUploadMessage}
              lookMessage={lookMessage}
              looks={looks}
              removeLookItem={removeLookItem}
              resetLookForm={resetLookForm}
              saveLook={saveLook}
              uploadingLookItemIndex={uploadingLookItemIndex}
              uploadLookImage={uploadLookImage}
              uploadLookItemImage={uploadLookItemImage}
              updateLookForm={updateLookForm}
              updateLookItem={updateLookItem}
            />
          )}
        </section>
      )}
    </main>
  );
}

function AdminLogin({ loginForm, loginMessage, onChange, onSubmit }) {
  return (
    <section className="admin-login-page">
      <div className="admin-login-intro">
        <p className="eyebrow">Espace prive</p>
        <h1>Maison Veliora</h1>
        <p>
          Accedez a votre espace de pilotage pour administrer le catalogue et les idees de look.
        </p>
        <div className="login-signature">
          <LockKeyhole size={18} /> Acces reserve a l'administration
        </div>
      </div>

      <form className="admin-login-card" onSubmit={onSubmit}>
        <div className="login-card-heading">
          <span className="login-mark"><LockKeyhole size={20} /></span>
          <div>
            <p className="eyebrow">Connexion securisee</p>
            <h2>Bienvenue</h2>
          </div>
        </div>

        <label>
          Adresse email
          <input
            autoComplete="email"
            onChange={(event) => onChange("email", event.target.value)}
            placeholder="vous@maisonveliora.com"
            required
            type="email"
            value={loginForm.email}
          />
        </label>
        <label>
          Mot de passe
          <input
            autoComplete="current-password"
            onChange={(event) => onChange("password", event.target.value)}
            placeholder="Votre mot de passe"
            required
            type="password"
            value={loginForm.password}
          />
        </label>

        <button className="login-submit" type="submit">
          Ouvrir le back-office <ArrowUpRight size={18} />
        </button>
        {loginMessage && <p className="login-message">{loginMessage}</p>}
      </form>
    </section>
  );
}

function WeeklyLook({ look }) {
  return (
    <section className="weekly-look" id="look-semaine">
      <div className="weekly-look-main">
        <div className="weekly-look-image">
          <img src={look.image} alt={look.title} />
        </div>
        <div className="weekly-look-content">
          <p className="eyebrow">{look.weekLabel}</p>
          <h2>{look.title}</h2>
          <p>{look.description}</p>
          <button className="primary-link" onClick={() => document.getElementById("look-items")?.scrollIntoView()}>
            Voir les pieces <ArrowUpRight size={18} />
          </button>
        </div>
      </div>

      <div className="look-items" id="look-items">
        {look.items?.map((item) => {
          const content = (
            <>
              <img src={item.image} alt={item.name} />
              <span>{item.category}</span>
              <strong>{item.name}</strong>
            </>
          );

          return item.affiliateUrl ? (
            <a className="look-item" href={item.affiliateUrl} target="_blank" rel="noreferrer sponsored" key={item.name}>
              {content}
            </a>
          ) : (
            <article className="look-item" key={item.name}>{content}</article>
          );
        })}
      </div>
    </section>
  );
}

function ProductStatus({ loading, error, retry, empty }) {
  if (loading) return <p className="catalog-status" role="status">Chargement des produits...</p>;
  if (error) return (
    <div className="catalog-status" role="alert">
      <p>{error}</p>
      <button className="secondary-action" type="button" onClick={retry}>Réessayer</button>
    </div>
  );
  return empty ? <p className="catalog-status" role="status">Aucun produit à afficher.</p> : null;
}

function normalizeSearch(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function usePagination(items) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  useEffect(() => { setPage((current) => Math.min(current, pageCount)); }, [pageCount]);
  return {
    items: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    total: items.length, page: currentPage, pageSize, pageCount, setPage,
    setPageSize: (size) => { setPageSize(size); setPage(1); }
  };
}

function AdminPagination({ pagination, label }) {
  const { total, page, pageSize, pageCount, setPage, setPageSize } = pagination;
  return (
    <nav className="admin-pagination" aria-label={`Pagination ${label}`}>
      <label>Lignes par page
        <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
          {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      <span role="status">{total === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} sur {total}</span>
      <div className="pagination-actions">
        <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Page précédente" title="Page précédente"><ChevronLeft size={18} /></button>
        <label>Page
          <select value={page} onChange={(event) => setPage(Number(event.target.value))}>
            {Array.from({ length: pageCount }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
          </select>
          <span>sur {pageCount}</span>
        </label>
        <button type="button" disabled={page === pageCount} onClick={() => setPage(page + 1)} aria-label="Page suivante" title="Page suivante"><ChevronRight size={18} /></button>
      </div>
    </nav>
  );
}

function ProductAdmin({
  adminMessage,
  deleteProduct,
  editProduct,
  editingId,
  form,
  imageUploadMessage,
  isSaving,
  isUploadingImage,
  products,
  productsLoading,
  productsError,
  loadProducts,
  resetForm,
  saveProduct,
  uploadProductImage,
  updateForm
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [featured, setFeatured] = useState("");
  const [sort, setSort] = useState("");
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  const filtered = products.filter((product) =>
    normalizeSearch(`${product.name} ${product.brand} ${product.category}`).includes(normalizeSearch(query)) &&
    (!category || product.category === category) &&
    (!featured || Boolean(product.isFeatured) === (featured === "yes"))
  );
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  if (sort === "clicks") filtered.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
  const pagination = usePagination(filtered);
  function changeFilter(setter, value) { setter(value); pagination.setPage(1); }
  return (
    <div className="admin-layout">
      <form className="admin-form" onSubmit={saveProduct}>
        <div className="form-title">
          <ShieldCheck size={20} />
          <strong>{editingId ? "Modifier le produit" : "Ajouter un produit"}</strong>
        </div>

        <label>
          Nom du produit
          <input value={form.name} onChange={(event) => updateForm("name", event.target.value)} required />
        </label>

        <label>
          Slug
          <input value={form.slug} onChange={(event) => updateForm("slug", event.target.value)} required />
        </label>

        <div className="form-grid">
          <label>
            Marque
            <input value={form.brand} onChange={(event) => updateForm("brand", event.target.value)} required />
          </label>
          <label>
            Categorie
            <input value={form.category} onChange={(event) => updateForm("category", event.target.value)} required />
          </label>
        </div>

        <div className="form-grid">
          <label>
            Prix
            <input value={form.price} onChange={(event) => updateForm("price", event.target.value)} placeholder="129 EUR" required />
          </label>
          <label>
            Note
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={form.rating}
              onChange={(event) => updateForm("rating", event.target.value)}
              required
            />
          </label>
        </div>

        <label>
          Image URL
          <input value={form.image} onChange={(event) => updateForm("image", event.target.value)} required />
        </label>

        <div className="image-upload-field">
          <label className="image-upload-button">
            <ImageUp size={18} />
            <span>{isUploadingImage ? "Upload en cours..." : "Choisir une image"}</span>
            <input
              accept="image/*"
              disabled={isUploadingImage}
              onChange={(event) => uploadProductImage(event.target.files?.[0])}
              type="file"
            />
          </label>
          {form.image && (
            <img className="image-upload-preview" src={form.image} alt="Apercu du produit" />
          )}
        </div>
        {imageUploadMessage && <p className="admin-message">{imageUploadMessage}</p>}

        <label>
          Lien d'affiliation
          <input value={form.affiliateUrl} onChange={(event) => updateForm("affiliateUrl", event.target.value)} required />
        </label>

        <label>
          Description
          <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} required />
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(event) => updateForm("isFeatured", event.target.checked)}
          />
          Mettre en avant
        </label>

        <div className="form-actions">
          <button className="affiliate-button" type="submit" disabled={isSaving}>
            <Save size={18} /> {isSaving ? "Enregistrement..." : "Enregistrer"}
          </button>
          {editingId && (
            <button className="secondary-action" type="button" onClick={resetForm}>
              <X size={18} /> Annuler
            </button>
          )}
        </div>

        {adminMessage && <p className="admin-message">{adminMessage}</p>}
      </form>

      <section className="admin-table" aria-label="Produits admin">
        <div className="admin-filters">
          <label className="admin-search">Rechercher un produit
            <input type="search" value={query} placeholder="Nom, marque, catégorie" onChange={(event) => changeFilter(setQuery, event.target.value)} />
          </label>
          <label>Catégorie
            <select value={category} onChange={(event) => changeFilter(setCategory, event.target.value)}>
              <option value="">Toutes</option>
              {categories.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>Mise en avant
            <select value={featured} onChange={(event) => changeFilter(setFeatured, event.target.value)}>
              <option value="">Tous</option><option value="yes">Mis en avant</option><option value="no">Non mis en avant</option>
            </select>
          </label>
          <label>Trier par
            <select value={sort} onChange={(event) => changeFilter(setSort, event.target.value)}>
              <option value="">Ordre initial</option><option value="name">Nom A–Z</option><option value="clicks">Les plus cliqués</option>
            </select>
          </label>
          <button type="button" className="secondary-action" onClick={() => { setQuery(""); setCategory(""); setFeatured(""); setSort(""); pagination.setPage(1); }}>Réinitialiser</button>
        </div>
        <div className="admin-table-head">
          <strong>{filtered.length} produits sur {products.length}</strong>
          <span>Total clics: {products.reduce((total, product) => total + (product.clicks || 0), 0)}</span>
        </div>

        <ProductStatus loading={productsLoading} error={productsError} retry={loadProducts} empty={filtered.length === 0} />
        {pagination.items.map((product) => (
          <article className="admin-row" key={product._id || product.slug}>
            <img src={product.image} alt={product.name} />
            <div>
              <strong>{product.name}</strong>
              <span>{product.category} - {product.brand}</span>
              <small>{product.clicks || 0} clics affiliation</small>
            </div>
            <div className="row-actions">
              <button type="button" onClick={() => editProduct(product)} aria-label={`Modifier ${product.name}`}>
                <Edit3 size={17} />
              </button>
              <button type="button" onClick={() => deleteProduct(product)} aria-label={`Supprimer ${product.name}`}>
                <Trash2 size={17} />
              </button>
            </div>
          </article>
        ))}
        <AdminPagination pagination={pagination} label="produits" />
      </section>
    </div>
  );
}

function LookAdmin({
  addLookItem,
  deleteLook,
  editLook,
  editingLookId,
  isUploadingLookImage,
  isSaving,
  lookForm,
  lookImageUploadMessage,
  lookItemImageUploadMessage,
  lookMessage,
  looks,
  removeLookItem,
  resetLookForm,
  saveLook,
  uploadingLookItemIndex,
  uploadLookImage,
  uploadLookItemImage,
  updateLookForm,
  updateLookItem
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const filtered = looks.filter((look) =>
    normalizeSearch(`${look.title} ${look.subtitle || ""} ${look.weekLabel || ""}`).includes(normalizeSearch(query)) &&
    (!status || Boolean(look.isActive) === (status === "active"))
  );
  const pagination = usePagination(filtered);
  return (
    <div className="admin-layout">
      <form className="admin-form" onSubmit={saveLook}>
        <div className="form-title">
          <Sparkles size={20} />
          <strong>{editingLookId ? "Modifier le look" : "Ajouter une idee de look"}</strong>
        </div>

        <label>
          Titre
          <input value={lookForm.title} onChange={(event) => updateLookForm("title", event.target.value)} required />
        </label>

        <label>
          Sous-titre
          <input value={lookForm.subtitle} onChange={(event) => updateLookForm("subtitle", event.target.value)} />
        </label>

        <label>
          Image principale
          <input
            value={lookForm.image}
            onChange={(event) => updateLookForm("image", event.target.value)}
            placeholder="/images/look-semaine.png"
            required
          />
        </label>
        <div className="image-upload-field">
          <label className="image-upload-button">
            <ImageUp size={18} />
            <span>{isUploadingLookImage ? "Upload en cours..." : "Choisir une image"}</span>
            <input
              accept="image/*"
              disabled={isUploadingLookImage}
              onChange={(event) => uploadLookImage(event.target.files?.[0])}
              type="file"
            />
          </label>
          {lookForm.image && (
            <img className="image-upload-preview" src={lookForm.image} alt="Apercu du look" />
          )}
        </div>
        {lookImageUploadMessage && <p className="admin-message">{lookImageUploadMessage}</p>}

        <label>
          Description
          <textarea value={lookForm.description} onChange={(event) => updateLookForm("description", event.target.value)} required />
        </label>

        <label>
          Libelle semaine
          <input value={lookForm.weekLabel} onChange={(event) => updateLookForm("weekLabel", event.target.value)} />
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={lookForm.isActive}
            onChange={(event) => updateLookForm("isActive", event.target.checked)}
          />
          Afficher comme look de la semaine
        </label>

        <div className="look-items-editor">
          <div className="form-title">
            <strong>Pieces du look</strong>
            <button className="mini-action" type="button" onClick={addLookItem}>
              <Plus size={16} /> Ajouter
            </button>
          </div>

          {lookForm.items.map((item, index) => (
            <div className="look-item-editor" key={`item-${index}`}>
              <div className="form-grid">
                <label>
                  Nom
                  <input value={item.name} onChange={(event) => updateLookItem(index, "name", event.target.value)} required />
                </label>
                <label>
                  Categorie
                  <input value={item.category} onChange={(event) => updateLookItem(index, "category", event.target.value)} required />
                </label>
              </div>
              <label>
                Image
                <input value={item.image} onChange={(event) => updateLookItem(index, "image", event.target.value)} required />
              </label>
              <div className="image-upload-field">
                <label className="image-upload-button">
                  <ImageUp size={18} />
                  <span>{uploadingLookItemIndex === index ? "Upload en cours..." : "Choisir une image"}</span>
                  <input
                    accept="image/*"
                    disabled={uploadingLookItemIndex === index}
                    onChange={(event) => uploadLookItemImage(index, event.target.files?.[0])}
                    type="file"
                  />
                </label>
                {item.image && (
                  <img className="image-upload-preview" src={item.image} alt={`Apercu ${item.name || "piece"}`} />
                )}
              </div>
              <label>
                Lien d'affiliation
                <input value={item.affiliateUrl} onChange={(event) => updateLookItem(index, "affiliateUrl", event.target.value)} />
              </label>
              <button className="secondary-action" type="button" onClick={() => removeLookItem(index)}>
                <Trash2 size={16} /> Retirer
              </button>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button className="affiliate-button" type="submit" disabled={isSaving}>
            <Save size={18} /> {isSaving ? "Enregistrement..." : "Enregistrer"}
          </button>
          {editingLookId && (
            <button className="secondary-action" type="button" onClick={resetLookForm}>
              <X size={18} /> Annuler
            </button>
          )}
        </div>

        {lookItemImageUploadMessage && <p className="admin-message">{lookItemImageUploadMessage}</p>}
        {lookMessage && <p className="admin-message">{lookMessage}</p>}
      </form>

      <section className="admin-table" aria-label="Looks admin">
        <div className="admin-filters">
          <label className="admin-search">Rechercher un look
            <input type="search" value={query} placeholder="Titre, sous-titre, libellé" onChange={(event) => { setQuery(event.target.value); pagination.setPage(1); }} />
          </label>
          <label>Statut
            <select value={status} onChange={(event) => { setStatus(event.target.value); pagination.setPage(1); }}>
              <option value="">Tous</option><option value="active">Actif</option><option value="inactive">Inactifs</option>
            </select>
          </label>
          <button type="button" className="secondary-action" onClick={() => { setQuery(""); setStatus(""); pagination.setPage(1); }}>Réinitialiser</button>
        </div>
        <div className="admin-table-head">
          <strong>{filtered.length} looks sur {looks.length}</strong>
          <span>{looks.find((look) => look.isActive)?.title || "Aucun actif"}</span>
        </div>

        {filtered.length === 0 && <p className="catalog-status">Aucun look à afficher.</p>}
        {pagination.items.map((look) => (
          <article className="admin-row" key={look._id || look.title}>
            <img src={look.image} alt={look.title} />
            <div>
              <strong>{look.title}</strong>
              <span>{look.weekLabel} {look.isActive ? "- actif" : ""}</span>
              <small>{look.items?.length || 0} pieces</small>
            </div>
            <div className="row-actions">
              <button type="button" onClick={() => editLook(look)} aria-label={`Modifier ${look.title}`}>
                <Edit3 size={17} />
              </button>
              <button type="button" onClick={() => deleteLook(look)} aria-label={`Supprimer ${look.title}`}>
                <Trash2 size={17} />
              </button>
            </div>
          </article>
        ))}
        <AdminPagination pagination={pagination} label="looks" />
      </section>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
