import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export default function Statistics({ apiUrl, token, products, looks }) {
  const [days, setDays] = useState(30);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    fetch(`${apiUrl}/statistics?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` }, signal: controller.signal
    }).then(async (response) => {
      if (response.status === 404) throw new Error("Le suivi des visites sera disponible après la mise à jour du serveur Render.");
      if (response.status === 401) throw new Error("Session expirée. Déconnectez-vous puis reconnectez-vous.");
      if (!response.ok) throw new Error("Impossible de charger les statistiques.");
      const result = await response.json();
      if (!Array.isArray(result.daily)) throw new Error("Réponse de statistiques invalide.");
      if (!controller.signal.aborted) setData(result);
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [apiUrl, token, days, revision]);
  const totalViews = data?.daily.reduce((sum, row) => sum + row.shop + row.looks, 0);
  const topProducts = [...products].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 10);
  const topLooks = [...looks].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);
  return <section className="statistics" aria-label="Statistiques">
    <div className="statistics-toolbar">
      <h2>Fréquentation</h2>
      <label>Période
        <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
          <option value={7}>7 derniers jours</option><option value={30}>30 derniers jours</option><option value={90}>90 derniers jours</option>
        </select>
      </label>
      <button type="button" className="secondary-action" disabled={loading} onClick={() => setRevision((value) => value + 1)} title="Actualiser les visites" aria-label="Actualiser les visites"><RefreshCw size={18} /></button>
    </div>
    {loading && <p role="status">Chargement des statistiques...</p>}
    {error && <p role="alert">{error}</p>}
    {data && <>
      <p className="statistics-total"><strong>{totalViews}</strong> pages vues sur la période</p>
      <p>Pages Boutique et Idées de look, jours en UTC. Les rechargements sont comptés. Ce total ne représente pas des visiteurs uniques.</p>
      <p>{data.startedAt ? `Première mesure : ${data.startedAt}.` : "Aucune visite enregistrée pour le moment."}</p>
      <div className="statistics-table-wrap"><table>
        <thead><tr><th>Date</th><th>Boutique</th><th>Idées de look</th><th>Total</th></tr></thead>
        <tbody>{[...data.daily].reverse().map((row) => <tr key={row.day}><th scope="row">{row.day}</th><td>{row.shop}</td><td>{row.looks}</td><td>{row.shop + row.looks}</td></tr>)}</tbody>
      </table></div>
    </>}
    <h2>Clics d’affiliation cumulés</h2>
    <p className="statistics-total"><strong>{products.reduce((sum, product) => sum + (product.clicks || 0), 0)}</strong> clics sur les produits actuels</p>
    <p>Historique disponible, toutes périodes confondues. Plusieurs clics peuvent provenir de la même personne.</p>
    <div className="statistics-table-wrap"><table>
      <thead><tr><th>Produit</th><th>Catégorie</th><th>Clics</th></tr></thead>
      <tbody>{topProducts.map((product) => <tr key={product._id || product.slug}><th scope="row">{product.name}</th><td>{product.category}</td><td>{product.clicks || 0}</td></tr>)}</tbody>
    </table>{!products.length && <p>Aucun produit disponible.</p>}</div>
    <h2>Looks les plus ouverts</h2>
    <p>Ouvertures cumulées, toutes périodes confondues.</p>
    <div className="statistics-table-wrap"><table>
      <thead><tr><th>Look</th><th>Ouvertures</th><th>J’aime</th></tr></thead>
      <tbody>{topLooks.map((look) => <tr key={look._id}><th scope="row">{look.title}</th><td>{look.views || 0}</td><td>{look.likes || 0}</td></tr>)}</tbody>
    </table>{!looks.length && <p>Aucun look disponible.</p>}</div>
  </section>;
}
