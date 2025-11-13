/*
 * script.js 파일
 * (추가/삭제 애니메이션 로직 적용됨)
 */

// 1. Firebase 설정 (변경 없음)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const linksCollection = db.collection("links"); 


// 2. DOM 로드 후 실행
document.addEventListener('DOMContentLoaded', () => {

    const linkGrid = document.getElementById('link-grid');
    const newLinkForm = document.getElementById('new-link-form');
    const searchBox = document.getElementById('search-box');
    const addLinkCard = document.getElementById('add-link-card');
    const cancelAddBtn = document.getElementById('cancel-add-btn');
    const modalOverlay = document.getElementById('modal-overlay');

    
    function closeModal() {
        modalOverlay.classList.add('hidden');
        newLinkForm.reset();
    }


    // [A. (수정됨) 데이터베이스에서 '변경 사항' 읽어오기]
    linksCollection.orderBy("title")
        .onSnapshot(snapshot => {
        
        // 로딩 메시지가 있다면 첫 데이터 로드 시 제거
        const loadingMessage = linkGrid.querySelector('.loading-message');
        if (loadingMessage) loadingMessage.remove();

        // [수정됨] 전체를 다시 그리는 대신, '변경분'만 처리
        snapshot.docChanges().forEach(change => {
            const doc = change.doc;
            const linkData = doc.data();
            
            // [추가됨]
            if (change.type === "added") {
                // 1. '추가'된 데이터만 카드 생성
                createLinkCard(doc.id, linkData.title, linkData.url);
            } 
            // [추가됨]
            else if (change.type === "removed") {
                // 2. '삭제'된 데이터만 카드 삭제
                deleteLinkCard(doc.id);
            }
            // (참고: 'modified'는 우리가 수정 기능을 안 만들었으므로 생략)
        });

        // 3. (검색 필터링은 create/delete가 아닌 '검색' 시에만 필요하므로 여기서 제거)
        // performSearch(); 

    }, error => {
        // ... (에러 처리 부분은 변경 없음) ...
    });


    // [B. '새 링크 추가' 카드 클릭 (변경 없음)]
    addLinkCard.addEventListener('click', () => {
        modalOverlay.classList.remove('hidden'); 
        document.getElementById('link-title').focus(); 
    });

    // [C. '취소' 버튼 클릭 (변경 없음)]
    cancelAddBtn.addEventListener('click', closeModal);

    // [D. 팝업 배경 클릭 (변경 없음)]
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // [E. 새 링크 '제출' (변경 없음)]
    newLinkForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const title = document.getElementById('link-title').value;
        const url = document.getElementById('link-url').value;
        linksCollection.add({ title: title, url: url })
            .then(() => closeModal())
            .catch(error => console.error("링크 추가 실패:", error));
    });


    // [F. 링크 삭제하기 (Delete) (변경 없음)]
    linkGrid.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            e.preventDefault(); 
            e.stopPropagation(); 
            const linkId = deleteButton.dataset.id; 
            if (confirm("이 링크를 정말 삭제하시겠습니까?")) {
                db.collection("links").doc(linkId).delete()
                .catch(error => console.error("삭제 실패:", error));
            }
        }
    });

    
    // [G. (수정됨) 링크 카드 생성 (애니메이션 클래스 추가)]
    function createLinkCard(id, title, url) {
        const card = document.createElement('article');
        // [수정됨] 'card-entering' 클래스를 추가하여 애니메이션 시작 상태로 만듦
        card.className = 'link-card card-entering'; 
        card.dataset.id = id; 

        card.innerHTML = `
            <button class="delete-btn" data-id="${id}">×</button>
            <a href="${url}" target="_blank" rel="noopener noreferrer">
                <img class="card-icon-img" src="" alt="Favicon" width="24" height="24">
                <div class="card-content">
                    <h2>${title}</h2>
                    <p class="card-url">${url}</p>
                </div>
            </a>
        `;
        
        linkGrid.appendChild(card);
        setupSpotlight(card);
        loadFavicon(card, url);

        // [수정됨] DOM에 추가된 직후, 'card-entering' 클래스를 제거하여
        // CSS transition(전환)이 작동하도록 함
        setTimeout(() => {
            card.classList.remove('card-entering');
        }, 10); // 아주 잠깐(10ms) 딜레이
    }


    // [H. (신규) 링크 카드 삭제 (애니메이션 적용)]
    function deleteLinkCard(id) {
        const card = linkGrid.querySelector(`.link-card[data-id="${id}"]`);
        if (card) {
            // [수정됨] 'card-exiting' 클래스를 추가하여 CSS transition(전환)을 발동
            card.classList.add('card-exiting');

            // [수정됨] 애니메이션이 끝난 후(0.3초) DOM에서 실제로 제거
            // (CSS의 transition 시간 0.3s와 일치해야 함)
            card.addEventListener('transitionend', () => {
                card.remove();
            }, { once: true }); // 이벤트가 한 번만 실행되도록
        }
    }


    // [I. 스포트라이트 설정 (Helper 함수)]
    function setupSpotlight(card) {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    }

    // [J. 파비콘 로드 (Helper 함수)]
    function loadFavicon(card, url) {
        const img = card.querySelector('.card-icon-img');
        if (!img) return;
        try {
            const hostname = new URL(url).hostname;
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=24`;
            img.src = faviconUrl;
            img.onerror = () => {
                img.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2QwZDBkMCIgd2lkdGg9IjI0cHgiIGhlaWdodD0iMjRweCI+PHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0zLjkgMTIuODVjMC0yLjYxIDEuOTctNC44MyA0LjU0LTUuMTlWMTAuNUg3LjI5Yy0uNDIgMC0uNzUuMzQtLjc1Ljc1cy4zMy43NS43NS43NWgxLjE1djEuMjVoLTEuMTljLS40MiAwLS43NS4zNC0uNzUuNzVzLjMzLjc1Ljc1Ljc1aDEuMTl2MS4yNUg3LjI5Yy0uNDIgMC0uNzUuMzQtLjc1Ljc1cy4zMy43NS43NS43NWgxLjE1di4xOUM1Ljg3IDE3LjY4IDMuOSAxNS40NiAzLjkgMTIuODV6TTEyLjUgNy42NnYxLjI1aDEuMTljLjQyIDAgLjc1LS4zNC43NS0uNzVzLS4zMy0uNzUtLjc1LS43NWgtMS4xOXptMCAxMC41aDEuMTljLjQyIDAgLjc1LS43NS43NS0uNzVzLS4zMy0uNzUtLjc1LS43NWgtMS4xOXYtMS4yNWgxLjE5Yy40IgMC0uNzUuNzUuNzV0Ljc1cy0uMzMtLjc1LS43NS0uNzVoLTEuMTl2LTEuMjVoMS4xOWMuNDIgMCAuNzUtLjM0Ljc1LS4zNXMzMy0uNzUtLjc1LS43NWgtMS4xOVY3LjY1YzIuNTcuMzYgNC41NCAyLjU4IDQuNTQgNS4xOXMtMS45NyA0LjgzLTQuNTQgNS4xOVYxOC4xNXpNMTAuODUgMTAuNWgtMS4xOUM5LjI0IDEwLjUgOSAxMC44NCA5IDExLjI1M3MtLjMzLjc1LS43NS43NWgxLjE5di0xLjI1ek0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDE4Yy00LjQxIDAtOC0zLjU5LTgtOHMzLjU5LTggOC04IDggMy41OSA4IDhzLTMuNTkgOC04IDh6Ii8+PC9zdmc+";
            };
        } catch (error) {
            img.onerror();
        }
    }

    // [K. 검색 기능 (변경 없음)]
    searchBox.addEventListener('input', performSearch);
    
    function performSearch() {
        const searchTerm = searchBox.value.toLowerCase().trim();
        const allCards = linkGrid.querySelectorAll('.link-card'); 

        allCards.forEach(card => {
            if (card.id === 'add-link-card') {
                card.style.display = ""; 
                return;
            }
            const titleElement = card.querySelector('.card-content h2');
            const urlElement = card.querySelector('.card-url');
            if (!titleElement || !urlElement) return;

            const title = titleElement.textContent.toLowerCase();
            const url = urlElement.textContent.toLowerCase();
            const isMatch = title.includes(searchTerm) || url.includes(searchTerm);
            
            card.style.display = isMatch ? "" : "none";
        });
    }


    // [L. 'ESC' 키로 팝업 닫기 (변경 없음)]
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
            closeModal();
        }
    });

}); // DOMContentLoaded 끝