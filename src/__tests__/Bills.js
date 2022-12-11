/**
 * @jest-environment jsdom
 */

 import { screen, waitFor } from "@testing-library/dom";
 import userEvent from "@testing-library/user-event";
 import BillsUI from "../views/BillsUI.js";
 import { bills } from "../fixtures/bills.js";
 import BillContainer from "../containers/Bills";
 import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
 import { localStorageMock } from "../__mocks__/localStorage.js";
 import mockStore from "../__mocks__/store";
 import router from "../app/Router.js";



jest.mock("../app/store", () => mockStore);

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
    })
  );
});

// Init onNavigate
const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({
    pathname,
  });
};



describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.className).toBe("active-icon")
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    test("Then i click on new bill button", async ()=>{
      const Bills = new BillContainer({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      document.body.innerHTML = BillsUI({ data: bills });

      const handleClickNewBill = jest.fn(() => Bills.handleClickNewBill());

      const buttonNewBill = screen.getByTestId("btn-new-bill");
      buttonNewBill.addEventListener("click", handleClickNewBill);
      userEvent.click(buttonNewBill);
      expect(handleClickNewBill).toHaveBeenCalled();


      
      await waitFor(() => screen.getByTestId("form-new-bill"));
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    })

    test("Then i click on iconEye", async ()=>{
      const Bills = new BillContainer({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      document.body.innerHTML = BillsUI({ data: bills });
      // j'appel cette fonction car l'appel de la modal et géré avec jquery, sans ça je ne peut faire fonctionné mon test.
      $.fn.modal = jest.fn();
      // Bills.handleClickIconEye = jest.fn();
    
      const handleClickIconEye =  jest.fn((e)=> Bills.handleClickIconEye(e));
      const buttonEye = screen.getAllByTestId("icon-eye")
      
      buttonEye.forEach(eye =>{
        eye.addEventListener("click", handleClickIconEye(eye))
        userEvent.click(eye);
        expect(handleClickIconEye).toHaveBeenCalled();
        
      })
          
      await waitFor(()=> screen.getByText("Justificatif"))
      expect(screen.getByText("Justificatif")).toBeTruthy()
      expect(screen.getByText("Justificatif")).toBeTruthy()
      
    })
  })


  // test d'intégration get bill
  // je suis connecté en tant qu'employée
  describe("Given i am connected as an employee", ()=>{
    // je demande la recuperation des factures
    describe("When i get bills", ()=>{
      // il devrait afficher les facture
      test("Then it should render bills", async ()=>{
        // recuperation des factures dans le store
        const Bills = new BillContainer({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });
        // ici je simule le click
        const getBills = jest.fn(()=> Bills.getBills())
        // je vérifie 
        const value = await getBills()
        // je regarde si la methode est appeler
        expect(getBills).toHaveBeenCalled()
        // je test si la longueur du tableau et different de 0, car dans le store il y a plusieurs factures.
        expect(value.length != 0).toBeTruthy()
      })
    })
      describe("When an error occurs on API", () => {
        beforeEach(() => {
          jest.spyOn(mockStore, "bills");
          const root = document.createElement("div");
          root.setAttribute("id", "root");
          document.body.appendChild(root);
          router();
        });
        it("fetches bills from an API and fails with 404 message error", async () => {
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list: () => {
                return Promise.reject(new Error("Erreur 404"));
              },
            };
          });
          window.onNavigate(ROUTES_PATH.Bills);
          await new Promise(process.nextTick);
          const message = await screen.getByText(/Erreur 404/)
          expect(message).toBeTruthy()
        });
        it("fetches messages from an API and fails with 500 message error", async () => {
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list: () => {
                return Promise.reject(new Error("Erreur 500"));
              },
            };
          });
    
          window.onNavigate(ROUTES_PATH.Bills);
          await new Promise(process.nextTick);
          const message = await screen.getByText(/Erreur 500/)
          expect(message).toBeTruthy()
        });
      });
  
  
  })
})
